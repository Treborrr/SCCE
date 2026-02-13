import { Module } from '@nestjs/common';
import { MuestrasService } from './muestras.service';
import { MuestrasController } from './muestras.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MuestrasController],
  providers: [MuestrasService],
})
export class MuestrasModule {}
