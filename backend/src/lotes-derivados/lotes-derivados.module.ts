import { Module } from '@nestjs/common';
import { LotesDerivadosController } from './lotes-derivados.controller';
import { LotesDerivadosService } from './lotes-derivados.service';

@Module({
  controllers: [LotesDerivadosController],
  providers: [LotesDerivadosService]
})
export class LotesDerivadosModule {}
