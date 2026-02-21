import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateDerivadoDto } from './dto/create-derivado.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class LotesDerivadosService {
  constructor(@Inject('PG_POOL') private pool: Pool) { }

  // Listar lotes disponibles para fusionar (ALMACEN con stock > 0)
  async obtenerLotesDisponibles() {
    const lotes = await this.pool.query(`
      SELECT id, codigo, proveedor_nombre, stock_actual, 'LOTE' as tipo
      FROM lotes
      WHERE estado = 'ALMACEN' AND stock_actual > 0
      ORDER BY codigo
    `);

    const derivados = await this.pool.query(`
      SELECT id, codigo, NULL as proveedor_nombre, stock_actual, 'DERIVADO' as tipo
      FROM lotes_derivados
      WHERE stock_actual > 0
      ORDER BY codigo
    `);

    return [...lotes.rows, ...derivados.rows];
  }

  // Listar todos los derivados
  async listarDerivados() {
    const result = await this.pool.query(`
      SELECT 
        ld.id,
        ld.codigo,
        ld.fecha_creacion,
        ld.stock_actual,
        ld.created_at,
        (
          SELECT COUNT(*) FROM muestras m WHERE m.lote_id = ld.id
        ) AS total_muestras,
        (
          SELECT json_agg(json_build_object(
            'origen_tipo', mi.origen_tipo,
            'origen_id', mi.origen_id,
            'cantidad_kg', mi.cantidad_kg,
            'codigo_origen', CASE
              WHEN mi.origen_tipo::text = 'LOTE' THEN (SELECT codigo FROM lotes WHERE id = mi.origen_id)
              ELSE (SELECT codigo FROM lotes_derivados WHERE id = mi.origen_id)
            END
          ))
          FROM movimientos_inventario mi
          WHERE mi.destino_derivado_id = ld.id
        ) AS origenes
      FROM lotes_derivados ld
      ORDER BY ld.created_at DESC
    `);
    return result.rows;
  }

  // Crear derivado (fusionar lotes)
  async crearDerivado(dto: CreateDerivadoDto, userId: string) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      if (!dto.origenes || dto.origenes.length === 0) {
        throw new BadRequestException('Debe seleccionar al menos un lote origen');
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
            `Stock insuficiente. Disponible: ${stockDisponible} kg`,
          );
        }

        totalStock += origen.cantidad_kg;
      }

      // Crear nuevo derivado
      const nuevoId = randomUUID();

      await client.query(
        `INSERT INTO lotes_derivados (id, codigo, fecha_creacion, stock_actual, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [nuevoId, dto.codigo, dto.fecha_creacion, totalStock, userId],
      );

      // Descontar stock y registrar movimientos
      for (const origen of dto.origenes) {
        if (origen.origen_tipo === 'LOTE') {
          await client.query(
            `UPDATE lotes SET stock_actual = stock_actual - $1 WHERE id = $2`,
            [origen.cantidad_kg, origen.origen_id],
          );
          // Si stock llega a 0, marcar como CONSUMIDO
          const checkStock = await client.query(
            `SELECT stock_actual FROM lotes WHERE id = $1`,
            [origen.origen_id],
          );
          if (Number(checkStock.rows[0]?.stock_actual) <= 0) {
            await client.query(
              `UPDATE lotes SET estado = 'CONSUMIDO' WHERE id = $1`,
              [origen.origen_id],
            );
          }
        } else {
          await client.query(
            `UPDATE lotes_derivados SET stock_actual = stock_actual - $1 WHERE id = $2`,
            [origen.cantidad_kg, origen.origen_id],
          );
        }

        await client.query(
          `INSERT INTO movimientos_inventario (origen_tipo, origen_id, destino_derivado_id, cantidad_kg, created_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [origen.origen_tipo, origen.origen_id, nuevoId, origen.cantidad_kg, userId],
        );
      }

      await client.query('COMMIT');

      return {
        message: 'Lote derivado creado correctamente',
        lote_derivado_id: nuevoId,
        codigo: dto.codigo,
        stock_total: totalStock,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Crear muestra de un derivado
  async crearMuestra(derivadoId: string, data: any, userId: string) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const derivado = await client.query(
        'SELECT stock_actual FROM lotes_derivados WHERE id = $1 FOR UPDATE',
        [derivadoId],
      );

      if (!derivado.rows.length) {
        throw new BadRequestException('Lote derivado no existe');
      }

      const pesoGramos = Number(data.peso_muestra_gramos);
      const stockActual = Number(derivado.rows[0].stock_actual);
      const descuentoKg = pesoGramos / 1000;

      if (descuentoKg > stockActual) {
        throw new BadRequestException('Stock insuficiente');
      }

      const nuevoStock = stockActual - descuentoKg;

      // Insertar muestra (usando lote_id para el derivado)
      const muestraResult = await client.query(
        `INSERT INTO muestras (lote_id, fecha, peso_muestra_gramos, humedad, stock_descontado_kg, created_by)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [derivadoId, data.fecha, pesoGramos, data.humedad || null, descuentoKg, userId],
      );

      await client.query(
        'UPDATE lotes_derivados SET stock_actual = $1 WHERE id = $2',
        [nuevoStock, derivadoId],
      );

      await client.query('COMMIT');

      return {
        message: 'Muestra creada',
        muestra: muestraResult.rows[0],
        nuevo_stock: nuevoStock,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}