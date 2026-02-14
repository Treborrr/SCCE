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
  constructor(private readonly cataService: CataService) {}

  // Crear sesión de cata
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CALIDAD')
  @Post(':muestraId/crear')
  async crearCata(
    @Param('muestraId') muestraId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.cataService.crearCata(
      muestraId,
      body,
      req.user.id,
    );
  }

  // Enviar respuesta (PÚBLICO - sin auth)
  @Post('responder/:cataId')
  async responderCata(
    @Param('cataId') cataId: string,
    @Body() body: any,
  ) {
    return this.cataService.responderCata(cataId, body);
  }
}
