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
exports.LotesDerivadosController = void 0;
const common_1 = require("@nestjs/common");
const lotes_derivados_service_1 = require("./lotes-derivados.service");
const create_derivado_dto_1 = require("./dto/create-derivado.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let LotesDerivadosController = class LotesDerivadosController {
    service;
    constructor(service) {
        this.service = service;
    }
    obtenerDisponibles() {
        return this.service.obtenerLotesDisponibles();
    }
    listarDerivados() {
        return this.service.listarDerivados();
    }
    crearDerivado(dto, req) {
        return this.service.crearDerivado(dto, req.user.id);
    }
    crearMuestra(derivadoId, body, req) {
        return this.service.crearMuestra(derivadoId, body, req.user.id);
    }
};
exports.LotesDerivadosController = LotesDerivadosController;
__decorate([
    (0, common_1.Get)('disponibles'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LotesDerivadosController.prototype, "obtenerDisponibles", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LotesDerivadosController.prototype, "listarDerivados", null);
__decorate([
    (0, common_1.Post)('crear'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_derivado_dto_1.CreateDerivadoDto, Object]),
    __metadata("design:returntype", void 0)
], LotesDerivadosController.prototype, "crearDerivado", null);
__decorate([
    (0, common_1.Post)(':derivadoId/muestra'),
    __param(0, (0, common_1.Param)('derivadoId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], LotesDerivadosController.prototype, "crearMuestra", null);
exports.LotesDerivadosController = LotesDerivadosController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'OPERADOR_ALMACEN'),
    (0, common_1.Controller)('lotes-derivados'),
    __metadata("design:paramtypes", [lotes_derivados_service_1.LotesDerivadosService])
], LotesDerivadosController);
//# sourceMappingURL=lotes-derivados.controller.js.map