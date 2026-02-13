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
const pg_1 = require("pg");
let LotesService = class LotesService {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async findAll() {
        const result = await this.pool.query('SELECT * FROM lotes');
        return result.rows;
    }
    async create(dto) {
        const query = `
      INSERT INTO lotes (
        id,
        codigo,
        fecha_compra,
        kg_baba_compra,
        kg_segunda,
        estado,
        created_at
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        $4,
        'INGRESADO',
        NOW()
      )
      RETURNING *;
    `;
        const values = [
            dto.codigo,
            dto.fecha_compra,
            dto.kg_baba_compra,
            dto.kg_segunda || 0
        ];
        const result = await this.pool.query(query, values);
        return result.rows[0];
    }
};
exports.LotesService = LotesService;
exports.LotesService = LotesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('PG_POOL')),
    __metadata("design:paramtypes", [pg_1.Pool])
], LotesService);
//# sourceMappingURL=lotes.service.js.map