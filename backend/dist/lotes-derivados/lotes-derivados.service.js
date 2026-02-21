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
    async crearDerivado(dto, userId) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            if (!dto.origenes || dto.origenes.length === 0) {
                throw new common_1.BadRequestException('Debe seleccionar al menos un lote origen');
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
                    throw new common_1.BadRequestException(`Stock insuficiente. Disponible: ${stockDisponible} kg`);
                }
                totalStock += origen.cantidad_kg;
            }
            const nuevoId = (0, crypto_1.randomUUID)();
            await client.query(`INSERT INTO lotes_derivados (id, codigo, fecha_creacion, stock_actual, created_by)
         VALUES ($1, $2, $3, $4, $5)`, [nuevoId, dto.codigo, dto.fecha_creacion, totalStock, userId]);
            for (const origen of dto.origenes) {
                if (origen.origen_tipo === 'LOTE') {
                    await client.query(`UPDATE lotes SET stock_actual = stock_actual - $1 WHERE id = $2`, [origen.cantidad_kg, origen.origen_id]);
                    const checkStock = await client.query(`SELECT stock_actual FROM lotes WHERE id = $1`, [origen.origen_id]);
                    if (Number(checkStock.rows[0]?.stock_actual) <= 0) {
                        await client.query(`UPDATE lotes SET estado = 'CONSUMIDO' WHERE id = $1`, [origen.origen_id]);
                    }
                }
                else {
                    await client.query(`UPDATE lotes_derivados SET stock_actual = stock_actual - $1 WHERE id = $2`, [origen.cantidad_kg, origen.origen_id]);
                }
                await client.query(`INSERT INTO movimientos_inventario (origen_tipo, origen_id, destino_derivado_id, cantidad_kg, created_by)
           VALUES ($1, $2, $3, $4, $5)`, [origen.origen_tipo, origen.origen_id, nuevoId, origen.cantidad_kg, userId]);
            }
            await client.query('COMMIT');
            return {
                message: 'Lote derivado creado correctamente',
                lote_derivado_id: nuevoId,
                codigo: dto.codigo,
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
    async crearMuestra(derivadoId, data, userId) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const derivado = await client.query('SELECT stock_actual FROM lotes_derivados WHERE id = $1 FOR UPDATE', [derivadoId]);
            if (!derivado.rows.length) {
                throw new common_1.BadRequestException('Lote derivado no existe');
            }
            const pesoGramos = Number(data.peso_muestra_gramos);
            const stockActual = Number(derivado.rows[0].stock_actual);
            const descuentoKg = pesoGramos / 1000;
            if (descuentoKg > stockActual) {
                throw new common_1.BadRequestException('Stock insuficiente');
            }
            const nuevoStock = stockActual - descuentoKg;
            const muestraResult = await client.query(`INSERT INTO muestras (lote_id, fecha, peso_muestra_gramos, humedad, stock_descontado_kg, created_by)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [derivadoId, data.fecha, pesoGramos, data.humedad || null, descuentoKg, userId]);
            await client.query('UPDATE lotes_derivados SET stock_actual = $1 WHERE id = $2', [nuevoStock, derivadoId]);
            await client.query('COMMIT');
            return {
                message: 'Muestra creada',
                muestra: muestraResult.rows[0],
                nuevo_stock: nuevoStock,
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