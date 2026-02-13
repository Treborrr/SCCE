import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class SecadoService {
  constructor(@Inject('PG_POOL') private pool: Pool) {}

  async finalizarSecado(loteId: string, data: any, userId: string) {
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

      if (lote.estado !== 'SECADO') {
        throw new Error('El lote no está en proceso de secado');
      }

      // Actualizar registro secado
      await client.query(
        `
        UPDATE secados
        SET fecha_fin = $1,
            hora_fin = $2,
            porcentaje_secado = $3
        WHERE lote_id = $4
        `,
        [
          data.fecha_fin,
          data.hora_fin,
          data.porcentaje_secado,
          loteId,
        ],
      );

      // Cambiar estado del lote
      await client.query(
        `UPDATE lotes SET estado = 'LISTO_PARA_ALMACEN' WHERE id = $1`,
        [loteId],
      );

      await client.query('COMMIT');

      return {
        message: 'Secado finalizado correctamente',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
