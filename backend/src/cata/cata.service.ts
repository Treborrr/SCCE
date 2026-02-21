import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CataService {
  constructor(@Inject('PG_POOL') private pool: Pool) { }

  // Listar catas de una muestra
  async listarCatas(muestraId: string) {
    const catas = await this.pool.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM cata_invitaciones ci WHERE ci.cata_id = c.id AND ci.estado = 'RESPONDIDA') as completadas,
        (SELECT COUNT(*) FROM cata_invitaciones ci WHERE ci.cata_id = c.id) as total
       FROM catas c 
       WHERE c.muestra_id = $1 
       ORDER BY c.created_at DESC`,
      [muestraId],
    );
    return catas.rows;
  }

  // Crear sesión de cata
  async crearCata(muestraId: string, data: any, userId: string) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const muestraCheck = await client.query(
        'SELECT id FROM muestras WHERE id = $1',
        [muestraId],
      );

      if (!muestraCheck.rows.length) {
        throw new BadRequestException('Muestra no existe');
      }

      const cataInsert = await client.query(
        `
        INSERT INTO catas (
          muestra_id,
          tipo,
          fecha,
          tipo_tueste,
          temperatura,
          tiempo,
          tostadora,
          total_catadores,
          estado,
          created_by
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ABIERTA',$9)
        RETURNING id
        `,
        [
          muestraId,
          data.tipo || 'NORMAL',
          data.fecha,
          data.tipo_tueste || null,
          data.temperatura || null,
          data.tiempo || null,
          data.tostadora || null,
          data.total_catadores,
          userId,
        ],
      );

      const cataId = cataInsert.rows[0].id;
      const tokens: string[] = [];
      const links: any[] = [];

      for (let i = 0; i < data.total_catadores; i++) {
        const token = uuidv4();
        tokens.push(token);

        await client.query(
          `INSERT INTO cata_invitaciones (cata_id, token) VALUES ($1,$2)`,
          [cataId, token],
        );

        links.push({
          catador: i + 1,
          token,
          url: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/cata/${token}`,
        });
      }

      await client.query('COMMIT');

      return {
        message: 'Cata creada correctamente',
        cata_id: cataId,
        links,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Obtener info de invitación por token (PÚBLICO)
  async obtenerInvitacion(token: string) {
    const result = await this.pool.query(
      `SELECT ci.id, ci.estado, ci.cata_id, ci.token,
              c.tipo_tueste, c.fecha as cata_fecha,
              m.id as muestra_id, l.codigo as lote_codigo
       FROM cata_invitaciones ci
       JOIN catas c ON c.id = ci.cata_id
       JOIN muestras m ON m.id = c.muestra_id
       JOIN lotes l ON l.id = m.lote_id
       WHERE ci.token = $1`,
      [token],
    );

    if (!result.rows.length) {
      throw new BadRequestException('Token inválido');
    }

    return result.rows[0];
  }

  // Responder cata (PÚBLICO - sin auth)
  async responderCata(token: string, data: any) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const invitacion = await client.query(
        `SELECT id, estado, cata_id FROM cata_invitaciones WHERE token = $1 FOR UPDATE`,
        [token],
      );

      if (!invitacion.rows.length) {
        throw new BadRequestException('Token inválido');
      }

      if (invitacion.rows[0].estado === 'RESPONDIDA') {
        throw new BadRequestException('Esta invitación ya fue respondida');
      }

      const invitacionId = invitacion.rows[0].id;
      const cataId = invitacion.rows[0].cata_id;

      // Actualizar nombre en invitación
      await client.query(
        `UPDATE cata_invitaciones SET nombre_catador = $1 WHERE id = $2`,
        [data.nombre_catador, invitacionId],
      );

      // Insertar respuesta
      await client.query(
        `
        INSERT INTO cata_respuestas (
          invitacion_id,
          nombre_catador,
          fecha,
          tipo_tueste,
          tostado, defecto, cacao, amargor, astringencia,
          acidez, fruta_fresca, fruta_marron, vegetal,
          floral, madera, especies, nueces, caramel_pan, global
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
        `,
        [
          invitacionId,
          data.nombre_catador,
          data.fecha,
          data.tipo_tueste,
          data.tostado || 0,
          data.defecto || 0,
          data.cacao || 0,
          data.amargor || 0,
          data.astringencia || 0,
          data.acidez || 0,
          data.fruta_fresca || 0,
          data.fruta_marron || 0,
          data.vegetal || 0,
          data.floral || 0,
          data.madera || 0,
          data.especies || 0,
          data.nueces || 0,
          data.caramel_pan || 0,
          data.global || 0,
        ],
      );

      // Marcar como completada
      await client.query(
        `UPDATE cata_invitaciones SET estado = 'RESPONDIDA', responded_at = NOW() WHERE id = $1`,
        [invitacionId],
      );

      // Si todas completadas, cerrar cata
      const pendientes = await client.query(
        `SELECT COUNT(*) FROM cata_invitaciones WHERE cata_id = $1 AND estado != 'RESPONDIDA'`,
        [cataId],
      );

      if (Number(pendientes.rows[0].count) === 0) {
        await client.query(
          `UPDATE catas SET estado = 'CERRADA' WHERE id = $1`,
          [cataId],
        );
      }

      await client.query('COMMIT');

      return { message: 'Cata respondida correctamente' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Obtener resultados de una cata
  async obtenerResultados(cataId: string) {
    const respuestas = await this.pool.query(
      `SELECT cr.*, ci.nombre_catador as catador_nombre
       FROM cata_respuestas cr
       JOIN cata_invitaciones ci ON ci.id = cr.invitacion_id
       WHERE ci.cata_id = $1
       ORDER BY cr.created_at`,
      [cataId],
    );

    return respuestas.rows;
  }
}