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
exports.LotesService = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const pg_1 = require("pg");
let LotesService = class LotesService {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async create(dto, userId) {
        const existe = await this.pool.query(`SELECT id FROM lotes WHERE codigo = $1`, [dto.codigo]);
        if (existe.rows.length > 0) {
            throw new common_1.BadRequestException('Ya existe un lote con ese código');
        }
        const result = await this.pool.query(`
      INSERT INTO lotes (
        codigo,
        fecha_compra,
        proveedor_nombre,
        kg_baba_compra,
        kg_segunda,
        estado,
        stock_actual,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, 'INGRESADO', 0, $6)
      RETURNING *
      `, [
            dto.codigo,
            dto.fecha_compra,
            dto.proveedor_nombre,
            dto.kg_baba_compra,
            dto.kg_segunda ?? 0,
            userId
        ]);
        return result.rows[0];
    }
    async findAll() {
        const result = await this.pool.query(`
      SELECT *
      FROM lotes
      ORDER BY created_at DESC
    `);
        return result.rows;
    }
    async findOne(id) {
        const result = await this.pool.query(`SELECT * FROM lotes WHERE id = $1`, [id]);
        if (result.rows.length === 0) {
            throw new common_1.BadRequestException('Lote no encontrado');
        }
        return result.rows[0];
    }
    async remove(id) {
        const result = await this.pool.query(`DELETE FROM lotes WHERE id = $1 RETURNING *`, [id]);
        if (result.rows.length === 0) {
            throw new common_1.BadRequestException('Lote no encontrado');
        }
        return {
            message: 'Lote eliminado correctamente'
        };
    }
};
exports.LotesService = LotesService;
exports.LotesService = LotesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_2.Inject)('PG_POOL')),
    __metadata("design:paramtypes", [pg_1.Pool])
], LotesService);
//# sourceMappingURL=lotes.service.js.map