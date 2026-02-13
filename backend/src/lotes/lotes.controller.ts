import { Controller, Get, Body, Post } from '@nestjs/common';
import { LotesService } from './lotes.service';
import { CreateLoteDto } from './dto/create-lote.dto';

@Controller('lotes')
export class LotesController {
  constructor(private readonly lotesService: LotesService) {}

  @Get()
  findAll() {
    return this.lotesService.findAll();
  }

  @Post()
  create(@Body() dto: CreateLoteDto) {
    return this.lotesService.create(dto);
  }
}
