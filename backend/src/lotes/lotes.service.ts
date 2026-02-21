import { Injectable, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateLoteDto } from './dto/create-lote.dto';


@Injectable()
export class LotesService {
  constructor(@Inject('PG_POOL') private pool: Pool) { }

  // =========================
  // CREAR LOTE
  // =========================
  async create(dto: CreateLoteDto, userId: string) {
    try {
      const result = await this.pool.query(
        `
        INSERT INTO lotes (
          codigo,
          fecha_compra,
          proveedor_nombre,
          kg_baba_compra,
          kg_segunda,
          estado,
          stock_actual,
          created_by
        )
        VALUES ($1, $2, $3, $4, $5, 'LISTO_PARA_FERMENTACION', 0, $6)
        RETURNING *
        `,
        [
          dto.codigo,
          dto.fecha_compra,
          dto.proveedor_nombre,
          dto.kg_baba_compra,
          dto.kg_segunda ?? 0,
          userId
        ]
      );

      return result.rows[0];

    } catch (error) {
      if (error instanceof Object && 'code' in error && (error as any).code === '23505') {
        throw new BadRequestException('Ya existe un lote con ese código');
      }

      throw error;
    }
  }


  // =========================
  // LISTAR LOTES
  // =========================
  async findAll() {
    const result = await this.pool.query(`
      SELECT 
        id,
        codigo,
        fecha_compra,
        proveedor_nombre,
        kg_baba_compra,
        kg_segunda,
        estado
      FROM lotes
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  // =========================
  // OBTENER POR ID
  // =========================
  async findOne(id: string) {
    const result = await this.pool.query(
      `SELECT * FROM lotes WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new BadRequestException('Lote no encontrado');
    }

    return result.rows[0];
  }

  // Pasar Lote a Listo para Fermentar
  async marcarListoFermentacion(id: string) {
    const result = await this.pool.query(
      `
      UPDATE lotes
      SET estado = 'LISTO_PARA_FERMENTACION'
      WHERE id = $1
      RETURNING *
      `,
      [id],
    );

    if (result.rows.length === 0) {
      throw new Error('Lote no encontrado');
    }

    return result.rows[0];
  }

  // =========================
  // ELIMINAR LOTE
  // (recuerda: sistema inmutable → mejor eliminar y volver a crear)
  // =========================
  async remove(id: string) {
    const result = await this.pool.query(
      `DELETE FROM lotes WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new BadRequestException('Lote no encontrado');
    }

    return {
      message: 'Lote eliminado correctamente'
    };
  }
}
