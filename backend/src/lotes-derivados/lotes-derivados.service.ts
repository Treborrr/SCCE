import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateDerivadoDto } from './dto/create-derivado.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class LotesDerivadosService {
  constructor(@Inject('PG_POOL') private pool: Pool) {}

  async crearDerivado(dto: CreateDerivadoDto, userId: string) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      if (!dto.origenes || dto.origenes.length === 0) {
        throw new BadRequestException('Debe enviar al menos un origen');
      }

      let totalStock = 0;

      // Validar cada origen
      for (const origen of dto.origenes) {
        if (origen.cantidad_kg <= 0) {
          throw new BadRequestException('Cantidad inválida');
        }

        let queryStock;

        if (origen.origen_tipo === 'LOTE') {
          queryStock = await client.query(
            `SELECT stock_actual FROM lotes WHERE id = $1 FOR UPDATE`,
            [origen.origen_id],
          );
        } else {
          queryStock = await client.query(
            `SELECT stock_actual FROM lotes_derivados WHERE id = $1 FOR UPDATE`,
            [origen.origen_id],
          );
        }

        if (queryStock.rowCount === 0) {
          throw new BadRequestException('Origen no encontrado');
        }

        const stockDisponible = Number(queryStock.rows[0].stock_actual);

        if (stockDisponible < origen.cantidad_kg) {
          throw new BadRequestException(
            `Stock insuficiente en origen ${origen.origen_id}`,
          );
        }

        totalStock += origen.cantidad_kg;
      }

      // Crear nuevo derivado
      const nuevoId = randomUUID();

      await client.query(
        `
        INSERT INTO lotes_derivados (
          id, codigo, fecha_creacion, stock_actual, created_by
        )
        VALUES ($1, $2, $3, $4, $5)
      `,
        [nuevoId, dto.codigo, dto.fecha_creacion, totalStock, userId],
      );

      // Descontar stock y registrar movimientos
      for (const origen of dto.origenes) {
        if (origen.origen_tipo === 'LOTE') {
          await client.query(
            `
            UPDATE lotes
            SET stock_actual = stock_actual - $1
            WHERE id = $2
          `,
            [origen.cantidad_kg, origen.origen_id],
          );
        } else {
          await client.query(
            `
            UPDATE lotes_derivados
            SET stock_actual = stock_actual - $1
            WHERE id = $2
          `,
            [origen.cantidad_kg, origen.origen_id],
          );
        }

        await client.query(
          `
          INSERT INTO movimientos_inventario (
            origen_tipo,
            origen_id,
            destino_derivado_id,
            cantidad_kg,
            created_by
          )
          VALUES ($1, $2, $3, $4, $5)
        `,
          [
            origen.origen_tipo,
            origen.origen_id,
            nuevoId,
            origen.cantidad_kg,
            userId,
          ],
        );
      }

      await client.query('COMMIT');

      return {
        message: 'Lote derivado creado correctamente',
        lote_derivado_id: nuevoId,
        stock_total: totalStock,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}