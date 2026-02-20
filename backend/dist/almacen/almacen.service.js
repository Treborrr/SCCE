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
exports.AlmacenService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
let AlmacenService = class AlmacenService {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
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
    async ingresarAlmacen(loteId, data, userId) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const loteResult = await client.query('SELECT estado, kg_baba_compra FROM lotes WHERE id = $1 FOR UPDATE', [loteId]);
            const lote = loteResult.rows[0];
            if (!lote) {
                throw new Error('Lote no existe');
            }
            if (lote.estado !== 'LISTO_PARA_ALMACEN') {
                throw new Error('El lote no está listo para ingresar a almacén');
            }
            const sacos = Number(data.sacos);
            const kgBrutos = Number(data.kg_brutos);
            if (sacos <= 0 || kgBrutos <= 0) {
                throw new Error('Valores inválidos');
            }
            const kgNeto = kgBrutos - (sacos * 0.2);
            const rendimiento = (kgNeto / Number(lote.kg_baba_compra)) * 100;
            if (kgNeto <= 0) {
                throw new Error('Kg neto inválido');
            }
            await client.query(`
        INSERT INTO almacenes (
          lote_id,
          fecha,
          hora,
          sacos,
          kg_brutos,
          created_by
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        `, [
                loteId,
                data.fecha,
                data.hora,
                sacos,
                kgBrutos,
                userId,
            ]);
            await client.query(`
        UPDATE lotes
        SET estado = 'ALMACEN',
            kg_neto_final = $1,
            rendimiento = $2,
            stock_actual = $1
        WHERE id = $3
        `, [kgNeto, rendimiento, loteId]);
            await client.query('COMMIT');
            return {
                message: 'Ingreso a almacén registrado correctamente',
                kg_neto: kgNeto,
                rendimiento: rendimiento,
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
exports.AlmacenService = AlmacenService;
exports.AlmacenService = AlmacenService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('PG_POOL')),
    __metadata("design:paramtypes", [pg_1.Pool])
], AlmacenService);
//# sourceMappingURL=almacen.service.js.map