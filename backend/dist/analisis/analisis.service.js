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
exports.AnalisisService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
let AnalisisService = class AnalisisService {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async crearAnalisisFisico(muestraId, data, userId) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const muestraResult = await client.query('SELECT id FROM muestras WHERE id = $1', [muestraId]);
            if (!muestraResult.rows.length) {
                throw new Error('Muestra no existe');
            }
            const analisisInsert = await client.query(`
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
        `, [
                muestraId,
                data.fecha,
                data.humedad,
                data.total_granos_corte,
                data.porcentaje_fermentacion,
                data.foto_url,
                data.observaciones,
                userId,
            ]);
            const analisisId = analisisInsert.rows[0].id;
            if (data.defectos && Array.isArray(data.defectos)) {
                for (const defecto of data.defectos) {
                    await client.query(`
            INSERT INTO analisis_defectos (
              analisis_id,
              tipo_defecto,
              gramos,
              porcentaje
            )
            VALUES ($1,$2,$3,$4)
            `, [
                        analisisId,
                        defecto.tipo_defecto,
                        defecto.gramos,
                        defecto.porcentaje,
                    ]);
                }
            }
            if (data.corte_detalle && Array.isArray(data.corte_detalle)) {
                for (const corte of data.corte_detalle) {
                    await client.query(`
            INSERT INTO analisis_corte_detalle (
              analisis_id,
              tipo_corte,
              cantidad_granos,
              porcentaje
            )
            VALUES ($1,$2,$3,$4)
            `, [
                        analisisId,
                        corte.tipo_corte,
                        corte.cantidad_granos,
                        corte.porcentaje,
                    ]);
                }
            }
            await client.query('COMMIT');
            return {
                message: 'Análisis físico registrado correctamente',
                analisis_id: analisisId,
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
exports.AnalisisService = AnalisisService;
exports.AnalisisService = AnalisisService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('PG_POOL')),
    __metadata("design:paramtypes", [pg_1.Pool])
], AnalisisService);
//# sourceMappingURL=analisis.service.js.map