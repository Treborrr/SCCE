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
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const uuid_1 = require("uuid");
const fermentacion_service_1 = require("./fermentacion.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let FermentacionController = class FermentacionController {
    fermentacionService;
    constructor(fermentacionService) {
        this.fermentacionService = fermentacionService;
    }
    getLotesFermentacion() {
        return this.fermentacionService.getLotesFermentacion();
    }
    getEventos(loteId) {
        return this.fermentacionService.getEventos(loteId);
    }
    async crearEvento(loteId, body, req) {
        return this.fermentacionService.crearEvento(loteId, body, req.user.id);
    }
    uploadFoto(file) {
        if (!file) {
            throw new common_1.BadRequestException('No se recibió ningún archivo');
        }
        return {
            foto_url: `${process.env.BACKEND_URL || 'http://localhost:3000'}/uploads/${file.filename}`,
        };
    }
    async actualizarFotoEvento(eventoId, body) {
        return this.fermentacionService.actualizarFotoEvento(eventoId, body.foto_url, body.descripcion);
    }
};
exports.FermentacionController = FermentacionController;
__decorate([
    (0, common_1.Get)('lotes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FermentacionController.prototype, "getLotesFermentacion", null);
__decorate([
    (0, common_1.Get)(':loteId/eventos'),
    __param(0, (0, common_1.Param)('loteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FermentacionController.prototype, "getEventos", null);
__decorate([
    (0, common_1.Post)(':loteId/evento'),
    __param(0, (0, common_1.Param)('loteId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], FermentacionController.prototype, "crearEvento", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (_req, file, cb) => {
                const uniqueName = `${(0, uuid_1.v4)()}${(0, path_1.extname)(file.originalname)}`;
                cb(null, uniqueName);
            },
        }),
        fileFilter: (_req, file, cb) => {
            if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                return cb(new common_1.BadRequestException('Solo se permiten imágenes'), false);
            }
            cb(null, true);
        },
        limits: { fileSize: 10 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FermentacionController.prototype, "uploadFoto", null);
__decorate([
    (0, common_1.Patch)('evento/:eventoId/foto'),
    __param(0, (0, common_1.Param)('eventoId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FermentacionController.prototype, "actualizarFotoEvento", null);
exports.FermentacionController = FermentacionController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'OPERADOR_FERMENTACION'),
    (0, common_1.Controller)('fermentacion'),
    __metadata("design:paramtypes", [fermentacion_service_1.FermentacionService])
], FermentacionController);
//# sourceMappingURL=fermentacion.controller.js.map