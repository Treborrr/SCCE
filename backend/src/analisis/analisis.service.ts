import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class AnalisisService {
  constructor(@Inject('PG_POOL') private pool: Pool) {}

  async crearAnalisisFisico(
    muestraId: string,
    data: any,
    userId: string,
  ) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Validar que muestra exista
      const muestraResult = await client.query(
        'SELECT id FROM muestras WHERE id = $1',
        [muestraId],
      );

      if (!muestraResult.rows.length) {
        throw new Error('Muestra no existe');
      }

      // Insertar análisis principal
      const analisisInsert = await client.query(
        `
        INSERT INTO analisis_fisico (
          muestra_id,
          fecha,
          humedad,
          total_granos_corte,
          porcentaje_fermentacion,
          foto_url,
          observaciones,
          created_by
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING id
        `,
        [
          muestraId,
          data.fecha,
          data.humedad,
          data.total_granos_corte,
          data.porcentaje_fermentacion,
          data.foto_url,
          data.observaciones,
          userId,
        ],
      );

      const analisisId = analisisInsert.rows[0].id;

      // Insertar defectos físicos (si existen)
      if (data.defectos && Array.isArray(data.defectos)) {
        for (const defecto of data.defectos) {
          await client.query(
            `
            INSERT INTO analisis_defectos (
              analisis_id,
              tipo_defecto,
              gramos,
              porcentaje
            )
            VALUES ($1,$2,$3,$4)
            `,
            [
              analisisId,
              defecto.tipo_defecto,
              defecto.gramos,
              defecto.porcentaje,
            ],
          );
        }
      }

      // Insertar detalle de corte (si existe)
      if (data.corte_detalle && Array.isArray(data.corte_detalle)) {
        for (const corte of data.corte_detalle) {
          await client.query(
            `
            INSERT INTO analisis_corte_detalle (
              analisis_id,
              tipo_corte,
              cantidad_granos,
              porcentaje
            )
            VALUES ($1,$2,$3,$4)
            `,
            [
              analisisId,
              corte.tipo_corte,
              corte.cantidad_granos,
              corte.porcentaje,
            ],
          );
        }
      }

      await client.query('COMMIT');

      return {
        message: 'Análisis físico registrado correctamente',
        analisis_id: analisisId,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
