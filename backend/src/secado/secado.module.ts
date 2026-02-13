import { Module } from '@nestjs/common';
import { SecadoService } from './secado.service';
import { SecadoController } from './secado.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SecadoController],
  providers: [SecadoService],
})
export class SecadoModule {}
