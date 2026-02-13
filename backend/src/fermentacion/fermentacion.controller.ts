import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FermentacionService } from './fermentacion.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'OPERADOR_FERMENTACION')
@Controller('fermentacion')
export class FermentacionController {
  constructor(private readonly fermentacionService: FermentacionService) {}

  @Post(':loteId/evento')
  async crearEvento(
    @Param('loteId') loteId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.fermentacionService.crearEvento(
      loteId,
      body,
      req.user.id,
    );
  }
}