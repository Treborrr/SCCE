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
exports.UsuariosService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
let UsuariosService = class UsuariosService {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async findByEmail(email) {
        const result = await this.pool.query('SELECT * FROM usuarios WHERE email = $1 AND activo = true', [email]);
        return result.rows[0];
    }
    async findById(id) {
        const result = await this.pool.query('SELECT id, nombre, email, rol FROM usuarios WHERE id = $1 AND activo = true', [id]);
        return result.rows[0];
    }
    async create(nombre, email, passwordHash, rol) {
        const result = await this.pool.query(`INSERT INTO usuarios (nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, email, rol`, [nombre, email, passwordHash, rol]);
        return result.rows[0];
    }
};
exports.UsuariosService = UsuariosService;
exports.UsuariosService = UsuariosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('PG_POOL')),
    __metadata("design:paramtypes", [pg_1.Pool])
], UsuariosService);
//# sourceMappingURL=usuarios.service.js.map