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
exports.MuestrasService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
let MuestrasService = class MuestrasService {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async crearMuestra(loteId, data, userId) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const loteResult = await client.query('SELECT estado, stock_actual FROM lotes WHERE id = $1 FOR UPDATE', [loteId]);
            const lote = loteResult.rows[0];
            if (!lote) {
                throw new Error('Lote no existe');
            }
            if (lote.estado !== 'ALMACEN') {
                throw new Error('Solo lotes en ALMACEN pueden extraer muestras');
            }
            const pesoGramos = Number(data.peso_muestra_gramos);
            if (pesoGramos <= 0) {
                throw new Error('Peso de muestra inválido');
            }
            const stockActual = Number(lote.stock_actual);
            const descuentoKg = pesoGramos / 1000;
            if (descuentoKg > stockActual) {
                throw new Error('Stock insuficiente para extraer muestra');
            }
            await client.query(`
        INSERT INTO muestras (
          lote_id,
          fecha,
          peso_muestra_gramos,
          stock_descontado_kg,
          created_by
        )
        VALUES ($1,$2,$3,$4,$5)
        `, [
                loteId,
                data.fecha,
                pesoGramos,
                descuentoKg,
                userId,
            ]);
            await client.query(`
        UPDATE lotes
        SET stock_actual = $1
        WHERE id = $2
        `, [stockActual - descuentoKg, loteId]);
            await client.query('COMMIT');
            return {
                message: 'Muestra creada correctamente',
                descuento_kg: descuentoKg,
                nuevo_stock: stockActual - descuentoKg,
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
exports.MuestrasService = MuestrasService;
exports.MuestrasService = MuestrasService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('PG_POOL')),
    __metadata("design:paramtypes", [pg_1.Pool])
], MuestrasService);
//# sourceMappingURL=muestras.service.js.map