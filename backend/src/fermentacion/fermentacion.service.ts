import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class FermentacionService {
  constructor(@Inject('PG_POOL') private pool: Pool) {}

  async getLotesFermentacion() {
    const result = await this.pool.query(`
      SELECT 
        l.id,
        l.codigo,
        l.fecha_compra,
        l.estado,
        l.proveedor_nombre,
        (
          SELECT fe.tipo
          FROM fermentacion_eventos fe
          WHERE fe.lote_id = l.id
          ORDER BY fe.created_at DESC
          LIMIT 1
        ) AS ultimo_evento
      FROM lotes l
      WHERE l.estado IN ('LISTO_PARA_FERMENTACION', 'FERMENTACION')
      ORDER BY l.created_at DESC
    `);

    return result.rows;
  }
  async getEventos(loteId: string) {
    const result = await this.pool.query(`
      SELECT 
        fecha,
        hora,
        tipo,
        cajon,
        brix,
        ph_pepa,
        ph_pulpa,
        temperatura_interna,
        temperatura_ambiente,
        es_remocion,
        prueba_corte
      FROM fermentacion_eventos
      WHERE lote_id = $1
      ORDER BY fecha, hora
    `, [loteId]);

    return result.rows;
  }

  async registrarEvento(loteId: string, dto: any, userId: string) {
    const tipo = dto.tipo; 

    // Verificar si ya existe INICIO / FINAL
    const inicioExistente = await this.pool.query(
      `SELECT id FROM fermentacion_eventos
       WHERE lote_id = $1 AND tipo = 'INICIO'`,
      [loteId]
    );

    const finalExistente = await this.pool.query(
      `SELECT id FROM fermentacion_eventos
       WHERE lote_id = $1 AND tipo = 'FINAL'`,
      [loteId]
    );

    if (tipo === 'INICIO' && inicioExistente.rows.length > 0) {
      throw new Error('El lote ya tiene un INICIO');
    }

    if (tipo === 'REMOCION' && inicioExistente.rows.length === 0) {
      throw new Error('No se puede registrar REMOCION sin INICIO');
    }

    if (tipo === 'FINAL') {
      if (inicioExistente.rows.length === 0) {
        throw new Error('No se puede finalizar sin INICIO');
      }

      if (finalExistente.rows.length > 0) {
        throw new Error('El lote ya tiene FINAL');
      }

      await this.pool.query(
        `UPDATE lotes SET estado = 'SECADO'
         WHERE id = $1`,
        [loteId]
      );
    }

    if (tipo === 'INICIO') {
      await this.pool.query(
        `UPDATE lotes SET estado = 'FERMENTACION'
         WHERE id = $1`,
        [loteId]
      );
    }

    // 1️⃣ Verificar lote
    const lote = await this.pool.query(
      `SELECT estado FROM lotes WHERE id = $1`,
      [loteId]
    );

    if (lote.rows.length === 0) {
      throw new Error('Lote no encontrado');
    }

    // 2️⃣ Validaciones industriales

    if (tipo === 'INICIO') {

      const inicioExistente = await this.pool.query(
        `SELECT id FROM fermentacion_eventos
        WHERE lote_id = $1 AND tipo = 'INICIO'`,
        [loteId]
      );

      if (inicioExistente.rows.length > 0) {
        throw new Error('El lote ya tiene INICIO');
      }

      await this.pool.query(
        `UPDATE lotes SET estado = 'FERMENTACION'
        WHERE id = $1`,
        [loteId]
      );
    }

    let numeroRemocion: number | null = null;

    if (tipo === 'REMOCION') {

      const inicio = await this.pool.query(
        `SELECT id FROM fermentacion_eventos
        WHERE lote_id = $1 AND tipo = 'INICIO'`,
        [loteId]
      );

      if (inicio.rows.length === 0) {
        throw new Error('No se puede registrar REMOCION sin INICIO');
      }

      const remociones = await this.pool.query(
        `SELECT COUNT(*) FROM fermentacion_eventos
        WHERE lote_id = $1 AND tipo = 'REMOCION'`,
        [loteId]
      );

      numeroRemocion = parseInt(remociones.rows[0].count) + 1;
    }

    if (tipo === 'FINAL') {

      const finalExistente = await this.pool.query(
        `SELECT id FROM fermentacion_eventos
        WHERE lote_id = $1 AND tipo = 'FINAL'`,
        [loteId]
      );

      if (finalExistente.rows.length > 0) {
        throw new Error('Ya existe FINAL');
      }

      await this.pool.query(
        `UPDATE lotes SET estado = 'SECADO'
        WHERE id = $1`,
        [loteId]
      );
    }

    // 3️⃣ Insertar evento

    await this.pool.query(
      `
      INSERT INTO fermentacion_eventos (
        lote_id,
        tipo,
        fecha,
        hora,
        cajon,
        brix,
        ph_pepa,
        ph_pulpa,
        temperatura_interna,
        temperatura_ambiente,
        numero_remocion,
        prueba_corte,
        foto_url,
        created_by
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
      )
      `,
      [
        loteId,
        dto.tipo,
        dto.fecha,
        dto.hora,
        dto.cajon,
        dto.brix,
        dto.ph_pepa,
        dto.ph_pulpa,
        dto.temperatura,
        dto.temp_ambiente,
        numeroRemocion,
        dto.prueba_corte,
        dto.foto_url,
        userId
      ]
    );

    return { message: 'Evento registrado correctamente' };
  }

  async crearEvento(loteId: string, data: any, userId: string) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const loteResult = await client.query(
        'SELECT estado FROM lotes WHERE id = $1 FOR UPDATE',
        [loteId],
      );

      const lote = loteResult.rows[0];

      if (!lote) {
        throw new Error('Lote no existe');
      }

      // 🔒 VALIDACIONES DE ESTADO

      if (data.tipo === 'INICIO') {
        if (data.tipo === 'INICIO' && lote.estado !== 'LISTO_PARA_FERMENTACION') {
          throw new Error('Solo lotes LISTO_PARA_FERMENTACION pueden iniciar fermentación');
        }
      } else {
        if (lote.estado !== 'FERMENTACION') {
          throw new Error('El lote no está en fermentación');
        }
      }

      // 🔢 Numeración automática de remoción
      let numeroRemocion: number | null = null;

      if (data.tipo === 'REMOCION') {
        const countResult = await client.query(
          `SELECT COUNT(*) 
           FROM fermentacion_eventos 
           WHERE lote_id = $1 AND tipo = 'REMOCION'`,
          [loteId],
        );

        numeroRemocion = Number(countResult.rows[0].count) + 1;
      }

      // 📝 Insertar evento
      await client.query(
        `
        INSERT INTO fermentacion_eventos (
          lote_id,
          tipo,
          fecha,
          hora,
          cajon,
          brix,
          ph_pepa,
          ph_pulpa,
          temperatura_interna,
          temperatura_ambiente,
          es_remocion,
          prueba_corte,
          foto_url,
          descripcion,
          created_by
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        `,
        [
          loteId,
          data.tipo,
          data.fecha,
          data.hora,
          data.cajon,
          data.brix,
          data.ph_pepa,
          data.ph_pulpa,
          data.temperatura_interna,
          data.temperatura_ambiente,
          data.tipo === 'REMOCION',
          data.prueba_corte,
          data.foto_url,
          data.descripcion,
          userId,
        ],
      );

      // 🔁 TRANSICIONES DE ESTADO

      if (data.tipo === 'INICIO') {
        await client.query(
          `UPDATE lotes SET estado = 'FERMENTACION' WHERE id = $1`,
          [loteId],
        );
      }

      if (data.tipo === 'FINAL') {
        // Cambiar estado
        await client.query(
          `UPDATE lotes SET estado = 'SECADO' WHERE id = $1`,
          [loteId],
        );

        // Crear registro en secados automáticamente
        await client.query(
          `
          INSERT INTO secados (
            lote_id,
            fecha_inicio,
            hora_inicio,
            created_by
          )
          VALUES ($1,$2,$3,$4)
          `,
          [loteId, data.fecha , data.hora ,userId],
        );
      }

      await client.query('COMMIT');

      return {
        message: 'Evento registrado correctamente',
        numeroRemocion,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
