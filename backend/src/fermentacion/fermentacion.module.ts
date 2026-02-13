import { Module } from '@nestjs/common';
import { FermentacionService } from './fermentacion.service';
import { FermentacionController } from './fermentacion.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [FermentacionController],
  providers: [FermentacionService],
})
export class FermentacionModule {}
