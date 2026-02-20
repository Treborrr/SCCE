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
exports.SecadoService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
let SecadoService = class SecadoService {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async obtenerLotesEnSecado() {
        const result = await this.pool.query(`
      SELECT 
        l.id,
        l.codigo,
        l.fecha_compra,
        l.estado,
        l.proveedor_nombre,
        s.fecha_inicio,
        s.hora_inicio
      FROM lotes l
      LEFT JOIN secados s ON s.lote_id = l.id
      WHERE l.estado = 'SECADO'
      ORDER BY l.fecha_compra DESC
    `);
        return result.rows;
    }
    async obtenerSecado(loteId) {
        const result = await this.pool.query(`
      SELECT *
      FROM secados
      WHERE lote_id = $1
    `, [loteId]);
        return result[0];
    }
    async obtenerEventos(loteId) {
        const result = await this.pool.query(`
      SELECT *
      FROM secado_eventos
      WHERE lote_id = $1
      ORDER BY fecha ASC, hora ASC
    `, [loteId]);
        return result;
    }
    async finalizarSecado(loteId, data, userId) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const loteResult = await client.query('SELECT estado FROM lotes WHERE id = $1 FOR UPDATE', [loteId]);
            const lote = loteResult.rows[0];
            if (!lote) {
                throw new Error('Lote no existe');
            }
            if (lote.estado !== 'SECADO') {
                throw new Error('El lote no está en proceso de secado');
            }
            await client.query(`
        UPDATE secados
        SET fecha_fin = $1,
            hora_fin = $2,
            porcentaje_secado = $3
        WHERE lote_id = $4
        `, [
                data.fecha_fin,
                data.hora_fin,
                data.porcentaje_secado,
                loteId,
            ]);
            await client.query(`UPDATE lotes SET estado = 'LISTO_PARA_ALMACEN' WHERE id = $1`, [loteId]);
            await client.query('COMMIT');
            return {
                message: 'Secado finalizado correctamente',
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
};
exports.SecadoService = SecadoService;
exports.SecadoService = SecadoService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('PG_POOL')),
    __metadata("design:paramtypes", [pg_1.Pool])
], SecadoService);
//# sourceMappingURL=secado.service.js.map