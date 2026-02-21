import {
    Controller,
    Post,
    Body,
    Get,
    Param,
    UseGuards,
    Req,
} from '@nestjs/common';
import { LotesDerivadosService } from './lotes-derivados.service';
import { CreateDerivadoDto } from './dto/create-derivado.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'OPERADOR_ALMACEN')
@Controller('lotes-derivados')
export class LotesDerivadosController {
    constructor(private readonly service: LotesDerivadosService) { }

    @Get('disponibles')
    obtenerDisponibles() {
        return this.service.obtenerLotesDisponibles();
    }

    @Get()
    listarDerivados() {
        return this.service.listarDerivados();
    }

    @Post('crear')
    crearDerivado(@Body() dto: CreateDerivadoDto, @Req() req: any) {
        return this.service.crearDerivado(dto, req.user.id);
    }

    @Post(':derivadoId/muestra')
    crearMuestra(
        @Param('derivadoId') derivadoId: string,
        @Body() body: any,
        @Req() req: any,
    ) {
        return this.service.crearMuestra(derivadoId, body, req.user.id);
    }
}
