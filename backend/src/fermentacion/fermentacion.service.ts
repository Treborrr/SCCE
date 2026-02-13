import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class FermentacionService {
  constructor(@Inject('PG_POOL') private pool: Pool) {}

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
        if (lote.estado !== 'INGRESADO') {
          throw new Error('Solo lotes INGRESADO pueden iniciar fermentación');
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
}
