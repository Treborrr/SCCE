import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class AlmacenService {
  constructor(@Inject('PG_POOL') private pool: Pool) { }

  async obtenerLotesListos() {
    return this.pool.query(`
      SELECT 
        l.id,
        l.codigo,
        l.fecha_compra,
        l.estado,
        l.proveedor_nombre,
        l.kg_baba_compra
      FROM lotes l
      WHERE l.estado IN ('LISTO_PARA_ALMACEN', 'ALMACEN')
      ORDER BY l.created_at DESC
    `).then(r => r.rows);
  }

  async obtenerLotesEnAlmacen() {
    const result = await this.pool.query(`
      SELECT 
        l.id,
        l.codigo,
        l.proveedor_nombre,
        l.kg_baba_compra,
        l.kg_neto_final,
        l.rendimiento,
        l.stock_actual,
        a.fecha,
        a.hora,
        a.sacos,
        a.kg_brutos
      FROM lotes l
      LEFT JOIN almacenes a ON a.lote_id = l.id
      WHERE l.estado = 'ALMACEN' AND l.stock_actual > 0
      ORDER BY a.fecha DESC
    `);

    return result.rows;
  }

  async ingresarAlmacen(loteId: string, data: any, userId: string) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const loteResult = await client.query(
        'SELECT estado, kg_baba_compra FROM lotes WHERE id = $1 FOR UPDATE',
        [loteId],
      );

      const lote = loteResult.rows[0];

      if (!lote) {
        throw new BadRequestException('Lote no existe');
      }

      if (lote.estado !== 'LISTO_PARA_ALMACEN') {
        throw new BadRequestException('El lote no está listo para ingresar a almacén');
      }

      const sacos = Number(data.sacos);
      const kgBrutos = Number(data.kg_brutos);

      if (sacos <= 0 || kgBrutos <= 0) {
        throw new BadRequestException('Valores inválidos');
      }

      // 🔢 Cálculos automáticos
      const kgNeto = kgBrutos - (sacos * 0.2);
      const rendimiento = (kgNeto / Number(lote.kg_baba_compra)) * 100;

      if (kgNeto <= 0) {
        throw new BadRequestException('Kg neto inválido');
      }

      // 📝 Insertar registro en almacenes
      await client.query(
        `
        INSERT INTO almacenes (
          lote_id,
          fecha,
          hora,
          sacos,
          kg_brutos,
          created_by
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [loteId, data.fecha, data.hora, sacos, kgBrutos, userId],
      );

      // 🔁 Actualizar lote
      await client.query(
        `
        UPDATE lotes
        SET estado = 'ALMACEN',
            kg_neto_final = $1,
            rendimiento = $2,
            stock_actual = $1
        WHERE id = $3
        `,
        [kgNeto, rendimiento, loteId],
      );

      await client.query('COMMIT');

      return {
        message: 'Ingreso a almacén registrado correctamente',
        kg_neto: kgNeto,
        rendimiento: rendimiento,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
