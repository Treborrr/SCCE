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
    async obtenerLotesEnAlmacen() {
        const result = await this.pool.query(`
      SELECT 
        l.id,
        l.codigo,
        l.stock_actual,
        l.proveedor_nombre,
        a.sacos
      FROM lotes l
      LEFT JOIN almacenes a ON a.lote_id = l.id
      WHERE l.estado = 'ALMACEN'
      ORDER BY l.created_at DESC
    `);
        return result.rows;
    }
    async listarMuestras() {
        const result = await this.pool.query(`
      SELECT 
        m.id,
        m.lote_id,
        m.fecha,
        m.peso_muestra_gramos,
        m.humedad,
        m.stock_descontado_kg,
        m.created_at,
        COALESCE(l.codigo, ld.codigo) AS lote_codigo,
        COALESCE(l.proveedor_nombre, 'Derivado') AS proveedor_nombre,
        CASE WHEN l.id IS NOT NULL THEN 'LOTE' ELSE 'DERIVADO' END AS tipo_origen,
        (
          SELECT COUNT(*) 
          FROM analisis_fisicos af 
          WHERE af.muestra_id = m.id
        ) AS total_analisis,
        (
          SELECT COUNT(*) 
          FROM catas c 
          WHERE c.muestra_id = m.id
        ) AS total_catas
      FROM muestras m
      LEFT JOIN lotes l ON l.id = m.lote_id
      LEFT JOIN lotes_derivados ld ON ld.id = m.lote_id
      ORDER BY m.created_at DESC
    `);
        return result.rows;
    }
    async crearMuestra(loteId, data, userId) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const loteResult = await client.query('SELECT estado, stock_actual FROM lotes WHERE id = $1 FOR UPDATE', [loteId]);
            const lote = loteResult.rows[0];
            if (!lote) {
                throw new common_1.BadRequestException('Lote no existe');
            }
            if (lote.estado !== 'ALMACEN') {
                throw new common_1.BadRequestException('Solo lotes en ALMACEN pueden extraer muestras');
            }
            const pesoGramos = Number(data.peso_muestra_gramos);
            if (!pesoGramos || pesoGramos <= 0) {
                throw new common_1.BadRequestException('Peso de muestra inválido');
            }
            const stockActual = Number(lote.stock_actual);
            const descuentoKg = pesoGramos / 1000;
            if (descuentoKg > stockActual) {
                throw new common_1.BadRequestException('Stock insuficiente para extraer muestra');
            }
            const nuevoStock = stockActual - descuentoKg;
            const muestraResult = await client.query(`
        INSERT INTO muestras (
          lote_id,
          fecha,
          peso_muestra_gramos,
          humedad,
          stock_descontado_kg,
          created_by
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *
        `, [
                loteId,
                data.fecha,
                pesoGramos,
                data.humedad || null,
                descuentoKg,
                userId,
            ]);
            await client.query('UPDATE lotes SET stock_actual = $1 WHERE id = $2', [nuevoStock, loteId]);
            if (nuevoStock <= 0) {
                await client.query(`UPDATE lotes SET estado = 'CONSUMIDO' WHERE id = $1`, [loteId]);
            }
            await client.query('COMMIT');
            return {
                message: 'Muestra creada correctamente',
                muestra: muestraResult.rows[0],
                descuento_kg: descuentoKg,
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
    async obtenerAnalisis(muestraId) {
        const analisis = await this.pool.query(`SELECT * FROM analisis_fisicos WHERE muestra_id = $1 ORDER BY created_at DESC`, [muestraId]);
        const result = [];
        for (const a of analisis.rows) {
            const grupos = await this.pool.query(`SELECT * FROM analisis_fisico_grupos WHERE analisis_id = $1 ORDER BY numero_grupo`, [a.id]);
            result.push({ ...a, grupos: grupos.rows });
        }
        return result;
    }
    async crearAnalisis(muestraId, data, userId) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const muestraResult = await client.query('SELECT id FROM muestras WHERE id = $1', [muestraId]);
            if (muestraResult.rows.length === 0) {
                throw new common_1.BadRequestException('Muestra no existe');
            }
            const analisisResult = await client.query(`
        INSERT INTO analisis_fisicos (
          muestra_id,
          fecha,
          peso_muestra_gramos,
          humedad_porcentaje,
          foto_url,
          planos_gr,
          materia_extrana_gr,
          granos_menores_1gr_gr,
          pasillas_gr,
          multiples_gr,
          germinados_gr,
          numero_granos_evaluados,
          peso_100_granos_gr,
          numero_grupos_50_granos,
          created_by
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        RETURNING *
        `, [
                muestraId,
                data.fecha,
                data.peso_muestra_gramos,
                data.humedad_porcentaje,
                data.foto_url || null,
                data.planos_gr || 0,
                data.materia_extrana_gr || 0,
                data.granos_menores_1gr_gr || 0,
                data.pasillas_gr || 0,
                data.multiples_gr || 0,
                data.germinados_gr || 0,
                data.numero_granos_evaluados || 0,
                data.peso_100_granos_gr || 0,
                data.numero_grupos_50_granos || 0,
                userId,
            ]);
            const analisisId = analisisResult.rows[0].id;
            if (data.grupos && Array.isArray(data.grupos)) {
                for (let i = 0; i < data.grupos.length; i++) {
                    const grupo = data.grupos[i];
                    await client.query(`
            INSERT INTO analisis_fisico_grupos (
              analisis_id,
              numero_grupo,
              fermentado,
              violeta,
              pizarroso,
              hongos,
              insectos
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            `, [
                        analisisId,
                        i + 1,
                        grupo.fermentado || 0,
                        grupo.violeta || 0,
                        grupo.pizarroso || 0,
                        grupo.hongos || 0,
                        grupo.insectos || 0,
                    ]);
                }
            }
            await client.query('COMMIT');
            return {
                message: 'Análisis físico registrado correctamente',
                analisis: analisisResult.rows[0],
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