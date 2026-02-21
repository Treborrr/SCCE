import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Aumentar límite del body a 10MB para fotos en base64
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Servir carpeta uploads como archivos estáticos
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  app.enableCors({
    origin: true,
    credentials: true
  });

  // Inicializar la app (registra todas las rutas NestJS)
  await app.init();

  // Servir el build de Angular como archivos estáticos
  const expressApp = app.getHttpAdapter().getInstance();
  const distPath = join(__dirname, '..', '..', 'frontend', 'dist', 'frontend', 'browser');

  expressApp.use(express.static(distPath));

  // SPA fallback: cualquier ruta no manejada por NestJS devuelve index.html
  expressApp.use((_req: any, res: any) => {
    res.sendFile(join(distPath, 'index.html'));
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
