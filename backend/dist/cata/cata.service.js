"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CataService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const uuid_1 = require("uuid");
let CataService = class CataService {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async listarCatas(muestraId) {
        const catas = await this.pool.query(`SELECT c.*, 
        (SELECT COUNT(*) FROM cata_invitaciones ci WHERE ci.cata_id = c.id AND ci.estado = 'RESPONDIDA') as completadas,
        (SELECT COUNT(*) FROM cata_invitaciones ci WHERE ci.cata_id = c.id) as total
       FROM catas c 
       WHERE c.muestra_id = $1 
       ORDER BY c.created_at DESC`, [muestraId]);
        return catas.rows;
    }
    async crearCata(muestraId, data, userId) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const muestraCheck = await client.query('SELECT id FROM muestras WHERE id = $1', [muestraId]);
            if (!muestraCheck.rows.length) {
                throw new common_1.BadRequestException('Muestra no existe');
            }
            const cataInsert = await client.query(`
        INSERT INTO catas (
          muestra_id,
          tipo,
          fecha,
          tipo_tueste,
          total_catadores,
          estado,
          created_by
        )
        VALUES ($1,$2,$3,$4,$5,'ABIERTA',$6)
        RETURNING id
        `, [
                muestraId,
                data.tipo || 'NORMAL',
                data.fecha,
                data.tipo_tueste,
                data.total_catadores,
                userId,
            ]);
            const cataId = cataInsert.rows[0].id;
            const tokens = [];
            const links = [];
            for (let i = 0; i < data.total_catadores; i++) {
                const token = (0, uuid_1.v4)();
                tokens.push(token);
                await client.query(`INSERT INTO cata_invitaciones (cata_id, token) VALUES ($1,$2)`, [cataId, token]);
                links.push({
                    catador: i + 1,
                    token,
                    url: `http://localhost:4200/cata/${token}`,
                });
            }
            await client.query('COMMIT');
            return {
                message: 'Cata creada correctamente',
                cata_id: cataId,
                links,
            };
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async obtenerInvitacion(token) {
        const result = await this.pool.query(`SELECT ci.id, ci.estado, ci.cata_id, ci.token,
              c.tipo_tueste, c.fecha as cata_fecha,
              m.id as muestra_id, l.codigo as lote_codigo
       FROM cata_invitaciones ci
       JOIN catas c ON c.id = ci.cata_id
       JOIN muestras m ON m.id = c.muestra_id
       JOIN lotes l ON l.id = m.lote_id
       WHERE ci.token = $1`, [token]);
        if (!result.rows.length) {
            throw new common_1.BadRequestException('Token inválido');
        }
        return result.rows[0];
    }
    async responderCata(token, data) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const invitacion = await client.query(`SELECT id, estado, cata_id FROM cata_invitaciones WHERE token = $1 FOR UPDATE`, [token]);
            if (!invitacion.rows.length) {
                throw new common_1.BadRequestException('Token inválido');
            }
            if (invitacion.rows[0].estado === 'RESPONDIDA') {
                throw new common_1.BadRequestException('Esta invitación ya fue respondida');
            }
            const invitacionId = invitacion.rows[0].id;
            const cataId = invitacion.rows[0].cata_id;
            await client.query(`UPDATE cata_invitaciones SET nombre_catador = $1 WHERE id = $2`, [data.nombre_catador, invitacionId]);
            await client.query(`
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
        `, [
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
            ]);
            await client.query(`UPDATE cata_invitaciones SET estado = 'RESPONDIDA', responded_at = NOW() WHERE id = $1`, [invitacionId]);
            const pendientes = await client.query(`SELECT COUNT(*) FROM cata_invitaciones WHERE cata_id = $1 AND estado != 'RESPONDIDA'`, [cataId]);
            if (Number(pendientes.rows[0].count) === 0) {
                await client.query(`UPDATE catas SET estado = 'CERRADA' WHERE id = $1`, [cataId]);
            }
            await client.query('COMMIT');
            return { message: 'Cata respondida correctamente' };
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async obtenerResultados(cataId) {
        const respuestas = await this.pool.query(`SELECT cr.*, ci.nombre_catador as catador_nombre
       FROM cata_respuestas cr
       JOIN cata_invitaciones ci ON ci.id = cr.invitacion_id
       WHERE ci.cata_id = $1
       ORDER BY cr.created_at`, [cataId]);
        return respuestas.rows;
    }
};
exports.CataService = CataService;
exports.CataService = CataService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('PG_POOL')),
    __metadata("design:paramtypes", [pg_1.Pool])
], CataService);
//# sourceMappingURL=cata.service.js.map