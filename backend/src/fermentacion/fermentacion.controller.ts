import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
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
import { FermentacionService } from './fermentacion.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'OPERADOR_FERMENTACION')
@Controller('fermentacion')
export class FermentacionController {
  constructor(private readonly fermentacionService: FermentacionService) { }

  @Get('lotes')
  getLotesFermentacion() {
    return this.fermentacionService.getLotesFermentacion();
  }

  @Get(':loteId/eventos')
  getEventos(@Param('loteId') loteId: string) {
    return this.fermentacionService.getEventos(loteId);
  }

  @Post(':loteId/evento')
  async crearEvento(
    @Param('loteId') loteId: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.fermentacionService.crearEvento(
      loteId,
      body,
      req.user.id,
    );
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('foto', {
    storage: diskStorage({
      destination: './uploads',
      filename: (_req, file, cb) => {
        const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    }),
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new BadRequestException('Solo se permiten imágenes'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  }))
  uploadFoto(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    return {
      foto_url: `${process.env.BACKEND_URL || 'http://localhost:3000'}/uploads/${file.filename}`,
    };
  }

  @Patch('evento/:eventoId/foto')
  async actualizarFotoEvento(
    @Param('eventoId') eventoId: string,
    @Body() body: { foto_url: string; descripcion?: string },
  ) {
    return this.fermentacionService.actualizarFotoEvento(
      eventoId,
      body.foto_url,
      body.descripcion,
    );
  }
}