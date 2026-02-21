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
exports.MuestrasController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const crypto_1 = require("crypto");
const muestras_service_1 = require("./muestras.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let MuestrasController = class MuestrasController {
    muestrasService;
    constructor(muestrasService) {
        this.muestrasService = muestrasService;
    }
    obtenerLotesEnAlmacen() {
        return this.muestrasService.obtenerLotesEnAlmacen();
    }
    listarMuestras() {
        return this.muestrasService.listarMuestras();
    }
    async crearMuestra(loteId, body, req) {
        return this.muestrasService.crearMuestra(loteId, body, req.user.id);
    }
    obtenerAnalisis(muestraId) {
        return this.muestrasService.obtenerAnalisis(muestraId);
    }
    async crearAnalisis(muestraId, body, req) {
        return this.muestrasService.crearAnalisis(muestraId, body, req.user.id);
    }
    uploadFoto(file) {
        if (!file) {
            throw new common_1.BadRequestException('No se recibió ningún archivo');
        }
        return {
            foto_url: `${process.env.BACKEND_URL || 'http://localhost:3000'}/uploads/${file.filename}`,
        };
    }
};
exports.MuestrasController = MuestrasController;
__decorate([
    (0, common_1.Get)('lotes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MuestrasController.prototype, "obtenerLotesEnAlmacen", null);
__decorate([
    (0, common_1.Get)('todas'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MuestrasController.prototype, "listarMuestras", null);
__decorate([
    (0, common_1.Post)(':loteId/crear'),
    __param(0, (0, common_1.Param)('loteId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MuestrasController.prototype, "crearMuestra", null);
__decorate([
    (0, common_1.Get)(':muestraId/analisis'),
    __param(0, (0, common_1.Param)('muestraId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MuestrasController.prototype, "obtenerAnalisis", null);
__decorate([
    (0, common_1.Post)(':muestraId/analisis'),
    __param(0, (0, common_1.Param)('muestraId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MuestrasController.prototype, "crearAnalisis", null);
__decorate([
    (0, common_1.Post)('upload-foto'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('foto', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (_req, file, cb) => {
                const uniqueName = `muestra-${(0, crypto_1.randomUUID)()}${(0, path_1.extname)(file.originalname)}`;
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
], MuestrasController.prototype, "uploadFoto", null);
exports.MuestrasController = MuestrasController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'OPERADOR_ALMACEN'),
    (0, common_1.Controller)('muestras'),
    __metadata("design:paramtypes", [muestras_service_1.MuestrasService])
], MuestrasController);
//# sourceMappingURL=muestras.controller.js.map