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
exports.FermentacionService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
let FermentacionService = class FermentacionService {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async crearEvento(loteId, data, userId) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const loteResult = await client.query('SELECT estado FROM lotes WHERE id = $1 FOR UPDATE', [loteId]);
            const lote = loteResult.rows[0];
            if (!lote) {
                throw new Error('Lote no existe');
            }
            if (data.tipo === 'INICIO') {
                if (lote.estado !== 'INGRESADO') {
                    throw new Error('Solo lotes INGRESADO pueden iniciar fermentación');
                }
            }
            else {
                if (lote.estado !== 'FERMENTACION') {
                    throw new Error('El lote no está en fermentación');
                }
            }
            let numeroRemocion = null;
            if (data.tipo === 'REMOCION') {
                const countResult = await client.query(`SELECT COUNT(*) 
           FROM fermentacion_eventos 
           WHERE lote_id = $1 AND tipo = 'REMOCION'`, [loteId]);
                numeroRemocion = Number(countResult.rows[0].count) + 1;
            }
            await client.query(`
        INSERT INTO fermentacion_eventos (
          lote_id,
          tipo,
          fecha,
          hora,
          cajon,
          brix,
          ph_pepa,
          ph_pulpa,
          temperatura_interna,
          temperatura_ambiente,
          es_remocion,
          prueba_corte,
          foto_url,
          descripcion,
          created_by
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        `, [
                loteId,
                data.tipo,
                data.fecha,
                data.hora,
                data.cajon,
                data.brix,
                data.ph_pepa,
                data.ph_pulpa,
                data.temperatura_interna,
                data.temperatura_ambiente,
                data.tipo === 'REMOCION',
                data.prueba_corte,
                data.foto_url,
                data.descripcion,
                userId,
            ]);
            if (data.tipo === 'INICIO') {
                await client.query(`UPDATE lotes SET estado = 'FERMENTACION' WHERE id = $1`, [loteId]);
            }
            if (data.tipo === 'FINAL') {
                await client.query(`UPDATE lotes SET estado = 'SECADO' WHERE id = $1`, [loteId]);
                await client.query(`
          INSERT INTO secados (
            lote_id,
            fecha_inicio,
            hora_inicio,
            created_by
          )
          VALUES ($1,$2,$3,$4)
          `, [loteId, data.fecha, data.hora, userId]);
            }
            await client.query('COMMIT');
            return {
                message: 'Evento registrado correctamente',
                numeroRemocion,
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
exports.FermentacionService = FermentacionService;
exports.FermentacionService = FermentacionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('PG_POOL')),
    __metadata("design:paramtypes", [pg_1.Pool])
], FermentacionService);
//# sourceMappingURL=fermentacion.service.js.map