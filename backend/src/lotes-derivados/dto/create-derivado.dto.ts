export class CreateDerivadoDto {
  codigo: string;
  fecha_creacion: string;
  origenes: {
    origen_tipo: 'LOTE' | 'DERIVADO';
    origen_id: string;
    cantidad_kg: number;
  }[];
}