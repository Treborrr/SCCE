import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class FermentacionService {
  constructor(@Inject('PG_POOL') private pool: Pool) { }

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
        id,
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
        prueba_corte,
        foto_url,
        descripcion
      FROM fermentacion_eventos
      WHERE lote_id = $1
      ORDER BY fecha, hora
    `, [loteId]);

    return result.rows;
  }

  async crearEvento(loteId: string, data: any, userId: string) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // 1️⃣ Verificar lote
      const loteResult = await client.query(
        'SELECT estado FROM lotes WHERE id = $1 FOR UPDATE',
        [loteId],
      );

      const lote = loteResult.rows[0];

      if (!lote) {
        throw new BadRequestException('Lote no existe');
      }

      // 2️⃣ Verificar existencia de INICIO y FINAL
      const inicioResult = await client.query(
        `SELECT id FROM fermentacion_eventos WHERE lote_id = $1 AND tipo = 'INICIO'`,
        [loteId],
      );
      const tieneInicio = inicioResult.rows.length > 0;

      const finalResult = await client.query(
        `SELECT id FROM fermentacion_eventos WHERE lote_id = $1 AND tipo = 'FINAL'`,
        [loteId],
      );
      const tieneFinal = finalResult.rows.length > 0;

      // 3️⃣ Validaciones por tipo de evento
      if (data.tipo === 'INICIO') {
        if (lote.estado !== 'LISTO_PARA_FERMENTACION') {
          throw new BadRequestException('Solo lotes LISTO_PARA_FERMENTACION pueden iniciar fermentación');
        }
        if (tieneInicio) {
          throw new BadRequestException('El lote ya tiene un evento INICIO registrado');
        }
      }

      if (data.tipo === 'REMOCION') {
        if (!tieneInicio) {
          throw new BadRequestException('No se puede registrar REMOCIÓN sin un evento INICIO previo');
        }
        if (tieneFinal) {
          throw new BadRequestException('No se puede registrar eventos después del FINAL');
        }
      }

      if (data.tipo === 'CONTROL') {
        if (!tieneInicio) {
          throw new BadRequestException('No se puede registrar CONTROL sin un evento INICIO previo');
        }
        if (tieneFinal) {
          throw new BadRequestException('No se puede registrar eventos después del FINAL');
        }
      }

      if (data.tipo === 'FINAL') {
        if (!tieneInicio) {
          throw new BadRequestException('No se puede finalizar sin un evento INICIO previo');
        }
        if (tieneFinal) {
          throw new BadRequestException('El lote ya tiene un evento FINAL registrado');
        }
      }

      // 4️⃣ Validar fecha no menor al último evento
      const ultimoEventoResult = await client.query(
        `SELECT fecha, hora FROM fermentacion_eventos
         WHERE lote_id = $1
         ORDER BY fecha DESC, hora DESC
         LIMIT 1`,
        [loteId],
      );

      if (ultimoEventoResult.rows.length > 0) {
        const ultimo = ultimoEventoResult.rows[0];
        const fechaUltimo = String(ultimo.fecha).split('T')[0];
        const horaUltimo = ultimo.hora || '00:00';
        const fechaNueva = String(data.fecha);
        const horaNueva = data.hora || '00:00';

        const ultimaFecha = new Date(`${fechaUltimo}T${horaUltimo}`);
        const nuevaFecha = new Date(`${fechaNueva}T${horaNueva}`);

        if (nuevaFecha < ultimaFecha) {
          throw new BadRequestException(
            `La fecha/hora del evento no puede ser anterior al último evento registrado (${fechaUltimo} ${horaUltimo})`
          );
        }
      }

      // 5️⃣ Numeración automática de remoción
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

      // 6️⃣ Insertar evento
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
          data.prueba_corte || false,
          data.foto_url || null,
          data.descripcion,
          userId,
        ],
      );

      // 7️⃣ Transiciones de estado
      if (data.tipo === 'INICIO') {
        await client.query(
          `UPDATE lotes SET estado = 'FERMENTACION' WHERE id = $1`,
          [loteId],
        );
      }

      if (data.tipo === 'FINAL') {
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
          [loteId, data.fecha, data.hora, userId],
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

  // Actualizar foto y descripción de un evento existente
  async actualizarFotoEvento(eventoId: string, fotoUrl: string, descripcion?: string) {
    const result = await this.pool.query(
      `UPDATE fermentacion_eventos 
       SET foto_url = $1, descripcion = COALESCE($2, descripcion), prueba_corte = true
       WHERE id = $3 RETURNING *`,
      [fotoUrl, descripcion || null, eventoId],
    );

    if (result.rowCount === 0) {
      throw new BadRequestException('Evento no encontrado');
    }

    return result.rows[0];
  }
}
