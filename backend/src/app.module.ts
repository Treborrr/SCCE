import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { LotesModule } from './lotes/lotes.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { FermentacionModule } from './fermentacion/fermentacion.module';
import { SecadoModule } from './secado/secado.module';
import { AlmacenModule } from './almacen/almacen.module';
import { MuestrasModule } from './muestras/muestras.module';
import { AnalisisModule } from './analisis/analisis.module';
import { CataModule } from './cata/cata.module';
import { LotesDerivadosModule } from './lotes-derivados/lotes-derivados.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    DatabaseModule,
    LotesModule,
    UsuariosModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }), FermentacionModule, SecadoModule, AlmacenModule, MuestrasModule, AnalisisModule, CataModule, LotesDerivadosModule, DashboardModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
