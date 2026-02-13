import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { LotesModule } from './lotes/lotes.module';

@Module({
  imports: [DatabaseModule, LotesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
