import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateLoteDto {
  @IsString()
  @IsNotEmpty()
  codigo!: string;

  @IsDateString()
  @IsNotEmpty()
  fecha_compra!: string;

  @IsString()
  @IsNotEmpty()
  proveedor_nombre!: string;

  @IsNumber()
  @IsNotEmpty()
  kg_baba_compra!: number;

  @IsNumber()
  @IsOptional()
  kg_segunda?: number;
}