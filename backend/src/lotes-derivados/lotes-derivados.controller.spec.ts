import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LotesDerivadosService } from './lotes-derivados.service';
import { CreateDerivadoDto } from './dto/create-derivado.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('lotes-derivados')
export class LotesDerivadosController {
  constructor(private readonly service: LotesDerivadosService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async crear(@Body() dto: CreateDerivadoDto, @Req() req) {
    return this.service.crearDerivado(dto, req.user.userId);
  }
}