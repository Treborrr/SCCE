import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import { CataService } from './cata.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('cata')
export class CataController {
  constructor(private readonly cataService: CataService) { }

  // Listar catas de una muestra (protegido)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CALIDAD', 'OPERADOR_ALMACEN')
  @Get('muestra/:muestraId')
  listarCatas(@Param('muestraId') muestraId: string) {
    return this.cataService.listarCatas(muestraId);
  }

  // Crear sesión de cata (protegido)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CALIDAD', 'OPERADOR_ALMACEN')
  @Post(':muestraId/crear')
  async crearCata(
    @Param('muestraId') muestraId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.cataService.crearCata(muestraId, body, req.user.id);
  }

  // Obtener info de invitación (PÚBLICO)
  @Get('invitacion/:token')
  obtenerInvitacion(@Param('token') token: string) {
    return this.cataService.obtenerInvitacion(token);
  }

  // Enviar respuesta (PÚBLICO - sin auth)
  @Post('responder/:token')
  async responderCata(
    @Param('token') token: string,
    @Body() body: any,
  ) {
    return this.cataService.responderCata(token, body);
  }

  // Obtener resultados (protegido)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CALIDAD', 'OPERADOR_ALMACEN')
  @Get(':cataId/resultados')
  obtenerResultados(@Param('cataId') cataId: string) {
    return this.cataService.obtenerResultados(cataId);
  }
}
