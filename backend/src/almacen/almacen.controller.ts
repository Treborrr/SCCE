import {
  Controller,
  Post,
  Param,
  Body,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AlmacenService } from './almacen.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'OPERADOR_ALMACEN')
@Controller('almacen')
export class AlmacenController {
  constructor(private readonly almacenService: AlmacenService) {}
  @Get('lotes')
  getLotesFermentacion() {
    return this.almacenService.obtenerLotesListos();
  }
  @Post(':loteId/ingresar')
  async ingresarAlmacen(
    @Param('loteId') loteId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.almacenService.ingresarAlmacen(
      loteId,
      body,
      req.user.id,
    );
  }
}
