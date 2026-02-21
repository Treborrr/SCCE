import {
  Controller,
  Post,
  Param,
  Body,
  Get,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MuestrasService } from './muestras.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'OPERADOR_ALMACEN')
@Controller('muestras')
export class MuestrasController {
  constructor(private readonly muestrasService: MuestrasService) { }

  @Get('lotes')
  obtenerLotesEnAlmacen() {
    return this.muestrasService.obtenerLotesEnAlmacen();
  }

  @Get('todas')
  listarMuestras() {
    return this.muestrasService.listarMuestras();
  }

  @Post(':loteId/crear')
  async crearMuestra(
    @Param('loteId') loteId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.muestrasService.crearMuestra(
      loteId,
      body,
      req.user.id,
    );
  }

  @Get(':muestraId/analisis')
  obtenerAnalisis(@Param('muestraId') muestraId: string) {
    return this.muestrasService.obtenerAnalisis(muestraId);
  }

  @Post(':muestraId/analisis')
  async crearAnalisis(
    @Param('muestraId') muestraId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.muestrasService.crearAnalisis(
      muestraId,
      body,
      req.user.id,
    );
  }

  @Post('upload-foto')
  @UseInterceptors(FileInterceptor('foto', {
    storage: diskStorage({
      destination: './uploads',
      filename: (_req, file, cb) => {
        const uniqueName = `muestra-${uuidv4()}${extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    }),
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new BadRequestException('Solo se permiten imágenes'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  uploadFoto(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    return {
      foto_url: `${process.env.BACKEND_URL || 'http://localhost:3000'}/uploads/${file.filename}`,
    };
  }
}