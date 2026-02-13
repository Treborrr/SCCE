import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class MuestrasService {
  constructor(@Inject('PG_POOL') private pool: Pool) {}

  async crearMuestra(loteId: string, data: any, userId: string) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const loteResult = await client.query(
        'SELECT estado, stock_actual FROM lotes WHERE id = $1 FOR UPDATE',
        [loteId],
      );

      const lote = loteResult.rows[0];

      if (!lote) {
        throw new Error('Lote no existe');
      }

      if (lote.estado !== 'ALMACEN') {
        throw new Error('Solo lotes en ALMACEN pueden extraer muestras');
      }

      const pesoGramos = Number(data.peso_muestra_gramos);

      if (pesoGramos <= 0) {
        throw new Error('Peso de muestra inválido');
      }

      const stockActual = Number(lote.stock_actual);
      const descuentoKg = pesoGramos / 1000;

      if (descuentoKg > stockActual) {
        throw new Error('Stock insuficiente para extraer muestra');
      }

      // Insertar muestra
      await client.query(
        `
        INSERT INTO muestras (
          lote_id,
          fecha,
          peso_muestra_gramos,
          stock_descontado_kg,
          created_by
        )
        VALUES ($1,$2,$3,$4,$5)
        `,
        [
          loteId,
          data.fecha,
          pesoGramos,
          descuentoKg,
          userId,
        ],
      );

      // Actualizar stock
      await client.query(
        `
        UPDATE lotes
        SET stock_actual = $1
        WHERE id = $2
        `,
        [stockActual - descuentoKg, loteId],
      );

      await client.query('COMMIT');

      return {
        message: 'Muestra creada correctamente',
        descuento_kg: descuentoKg,
        nuevo_stock: stockActual - descuentoKg,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
