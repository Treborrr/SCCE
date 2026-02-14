import { Module } from '@nestjs/common';
import { CataService } from './cata.service';
import { CataController } from './cata.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CataController],
  providers: [CataService],
})
export class CataModule {}
