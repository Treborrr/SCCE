import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AnalisisService } from './analisis.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'CALIDAD')
@Controller('analisis')
export class AnalisisController {
  constructor(private readonly analisisService: AnalisisService) {}

  @Post(':muestraId/fisico')
  async crearAnalisisFisico(
    @Param('muestraId') muestraId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.analisisService.crearAnalisisFisico(
      muestraId,
      body,
      req.user.id,
    );
  }
}
