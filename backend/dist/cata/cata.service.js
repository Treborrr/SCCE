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
    async crearCata(muestraId, data, userId) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const muestraCheck = await client.query('SELECT id FROM muestras WHERE id = $1', [muestraId]);
            if (!muestraCheck.rows.length) {
                throw new Error('Muestra no existe');
            }
            const cataInsert = await client.query(`
        INSERT INTO catas (
          muestra_id,
          tipo,
          total_catadores,
          created_by
        )
        VALUES ($1,$2,$3,$4)
        RETURNING id
        `, [
                muestraId,
                data.tipo,
                data.total_catadores,
                userId,
            ]);
            const cataId = cataInsert.rows[0].id;
            const tokens = [];
            for (let i = 0; i < data.total_catadores; i++) {
                const token = (0, uuid_1.v4)();
                tokens.push(token);
                await client.query(`
          INSERT INTO cata_invitaciones (
            cata_id,
            token
          )
          VALUES ($1,$2)
          `, [cataId, token]);
            }
            await client.query('COMMIT');
            return {
                message: 'Cata creada correctamente',
                cata_id: cataId,
                tokens,
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
    async responderCata(token, data) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const invitacion = await client.query(`
        SELECT id, estado, cata_id
        FROM cata_invitaciones
        WHERE token = $1
        FOR UPDATE
        `, [token]);
            if (!invitacion.rows.length) {
                throw new Error('Token inválido');
            }
            if (invitacion.rows[0].estado === 'COMPLETADA') {
                throw new Error('Esta invitación ya fue respondida');
            }
            const invitacionId = invitacion.rows[0].id;
            const cataId = invitacion.rows[0].cata_id;
            await client.query(`
        INSERT INTO cata_respuestas (
          invitacion_id,
          tostado,
          defecto,
          cacao,
          amargor,
          astringencia,
          acidez,
          fruta_fresca,
          fruta_marron,
          vegetal,
          floral,
          madera,
          especies,
          nueces,
          caramel_pan,
          global
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        `, [
                invitacionId,
                data.tostado,
                data.defecto,
                data.cacao,
                data.amargor,
                data.astringencia,
                data.acidez,
                data.fruta_fresca,
                data.fruta_marron,
                data.vegetal,
                data.floral,
                data.madera,
                data.especies,
                data.nueces,
                data.caramel_pan,
                data.global,
            ]);
            await client.query(`
        UPDATE cata_invitaciones
        SET estado = 'COMPLETADA',
            responded_at = NOW()
        WHERE id = $1
        `, [invitacionId]);
            const pendientes = await client.query(`
        SELECT COUNT(*) FROM cata_invitaciones
        WHERE cata_id = $1 AND estado = 'PENDIENTE'
        `, [cataId]);
            if (Number(pendientes.rows[0].count) === 0) {
                await client.query(`
          UPDATE catas
          SET estado = 'CERRADA'
          WHERE id = $1
          `, [cataId]);
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
};
exports.CataService = CataService;
exports.CataService = CataService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('PG_POOL')),
    __metadata("design:paramtypes", [pg_1.Pool])
], CataService);
//# sourceMappingURL=cata.service.js.map