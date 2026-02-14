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
exports.LotesDerivadosService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const crypto_1 = require("crypto");
let LotesDerivadosService = class LotesDerivadosService {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async crearDerivado(dto, userId) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            if (!dto.origenes || dto.origenes.length === 0) {
                throw new common_1.BadRequestException('Debe enviar al menos un origen');
            }
            let totalStock = 0;
            for (const origen of dto.origenes) {
                if (origen.cantidad_kg <= 0) {
                    throw new common_1.BadRequestException('Cantidad inválida');
                }
                let queryStock;
                if (origen.origen_tipo === 'LOTE') {
                    queryStock = await client.query(`SELECT stock_actual FROM lotes WHERE id = $1 FOR UPDATE`, [origen.origen_id]);
                }
                else {
                    queryStock = await client.query(`SELECT stock_actual FROM lotes_derivados WHERE id = $1 FOR UPDATE`, [origen.origen_id]);
                }
                if (queryStock.rowCount === 0) {
                    throw new common_1.BadRequestException('Origen no encontrado');
                }
                const stockDisponible = Number(queryStock.rows[0].stock_actual);
                if (stockDisponible < origen.cantidad_kg) {
                    throw new common_1.BadRequestException(`Stock insuficiente en origen ${origen.origen_id}`);
                }
                totalStock += origen.cantidad_kg;
            }
            const nuevoId = (0, crypto_1.randomUUID)();
            await client.query(`
        INSERT INTO lotes_derivados (
          id, codigo, fecha_creacion, stock_actual, created_by
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [nuevoId, dto.codigo, dto.fecha_creacion, totalStock, userId]);
            for (const origen of dto.origenes) {
                if (origen.origen_tipo === 'LOTE') {
                    await client.query(`
            UPDATE lotes
            SET stock_actual = stock_actual - $1
            WHERE id = $2
          `, [origen.cantidad_kg, origen.origen_id]);
                }
                else {
                    await client.query(`
            UPDATE lotes_derivados
            SET stock_actual = stock_actual - $1
            WHERE id = $2
          `, [origen.cantidad_kg, origen.origen_id]);
                }
                await client.query(`
          INSERT INTO movimientos_inventario (
            origen_tipo,
            origen_id,
            destino_derivado_id,
            cantidad_kg,
            created_by
          )
          VALUES ($1, $2, $3, $4, $5)
        `, [
                    origen.origen_tipo,
                    origen.origen_id,
                    nuevoId,
                    origen.cantidad_kg,
                    userId,
                ]);
            }
            await client.query('COMMIT');
            return {
                message: 'Lote derivado creado correctamente',
                lote_derivado_id: nuevoId,
                stock_total: totalStock,
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
exports.LotesDerivadosService = LotesDerivadosService;
exports.LotesDerivadosService = LotesDerivadosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('PG_POOL')),
    __metadata("design:paramtypes", [pg_1.Pool])
], LotesDerivadosService);
//# sourceMappingURL=lotes-derivados.service.js.map