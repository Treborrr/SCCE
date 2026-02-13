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
exports.FermentacionController = void 0;
const common_1 = require("@nestjs/common");
const fermentacion_service_1 = require("./fermentacion.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let FermentacionController = class FermentacionController {
    fermentacionService;
    constructor(fermentacionService) {
        this.fermentacionService = fermentacionService;
    }
    async crearEvento(loteId, body, req) {
        return this.fermentacionService.crearEvento(loteId, body, req.user.id);
    }
};
exports.FermentacionController = FermentacionController;
__decorate([
    (0, common_1.Post)(':loteId/evento'),
    __param(0, (0, common_1.Param)('loteId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], FermentacionController.prototype, "crearEvento", null);
exports.FermentacionController = FermentacionController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'OPERADOR_FERMENTACION'),
    (0, common_1.Controller)('fermentacion'),
    __metadata("design:paramtypes", [fermentacion_service_1.FermentacionService])
], FermentacionController);
//# sourceMappingURL=fermentacion.controller.js.map