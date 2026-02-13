import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MuestrasService } from './muestras.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'OPERADOR_ALMACEN')
@Controller('muestras')
export class MuestrasController {
  constructor(private readonly muestrasService: MuestrasService) {}

  @Post(':loteId/crear')
  async crearMuestra(
    @Param('loteId') loteId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.muestrasService.crearMuestra(
      loteId,
      body,
      req.user.id,
    );
  }
}