import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [UsuariosService],
  exports: [UsuariosService],
  controllers: [UsuariosController]
})
export class UsuariosModule {}
