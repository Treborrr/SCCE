import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SecadoService } from './secado.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'OPERADOR_SECADO')
@Controller('secado')
export class SecadoController {
  constructor(private readonly secadoService: SecadoService) {}

  @Post(':loteId/finalizar')
  async finalizarSecado(
    @Param('loteId') loteId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.secadoService.finalizarSecado(
      loteId,
      body,
      req.user.id,
    );
  }
}
