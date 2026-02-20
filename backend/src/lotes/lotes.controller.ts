import { Controller, Get, Body, Post, UseGuards, Req } from '@nestjs/common';
import { LotesService } from './lotes.service';
import { CreateLoteDto } from './dto/create-lote.dto';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Patch, Param } from '@nestjs/common';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lotes')
export class LotesController {
  constructor(private readonly lotesService: LotesService) {}

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.lotesService.findAll();
  }

  @Post()
  create(@Body() dto: CreateLoteDto, @Req() req) {
    return this.lotesService.create(dto, req.user.userId);
  }
  @Patch(':id/listo-fermentacion')
  @Roles('ADMIN')
  marcarListoFermentacion(@Param('id') id: string) {
    return this.lotesService.marcarListoFermentacion(id);
  }
}