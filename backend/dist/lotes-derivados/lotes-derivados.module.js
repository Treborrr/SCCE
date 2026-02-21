"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LotesDerivadosModule = void 0;
const common_1 = require("@nestjs/common");
const lotes_derivados_controller_1 = require("./lotes-derivados.controller");
const lotes_derivados_service_1 = require("./lotes-derivados.service");
const database_module_1 = require("../database/database.module");
let LotesDerivadosModule = class LotesDerivadosModule {
};
exports.LotesDerivadosModule = LotesDerivadosModule;
exports.LotesDerivadosModule = LotesDerivadosModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        controllers: [lotes_derivados_controller_1.LotesDerivadosController],
        providers: [lotes_derivados_service_1.LotesDerivadosService]
    })
], LotesDerivadosModule);
//# sourceMappingURL=lotes-derivados.module.js.map