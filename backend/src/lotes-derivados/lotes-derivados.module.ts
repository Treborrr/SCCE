import { Module } from '@nestjs/common';
import { LotesDerivadosController } from './lotes-derivados.controller';
import { LotesDerivadosService } from './lotes-derivados.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [LotesDerivadosController],
  providers: [LotesDerivadosService]
})
export class LotesDerivadosModule { }
