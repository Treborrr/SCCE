import { LotesDerivadosService } from './lotes-derivados.service';
import { CreateDerivadoDto } from './dto/create-derivado.dto';
export declare class LotesDerivadosController {
    private readonly service;
    constructor(service: LotesDerivadosService);
    obtenerDisponibles(): Promise<any[]>;
    listarDerivados(): Promise<any[]>;
    crearDerivado(dto: CreateDerivadoDto, req: any): Promise<{
        message: string;
        lote_derivado_id: `${string}-${string}-${string}-${string}-${string}`;
        codigo: string;
        stock_total: number;
    }>;
    crearMuestra(derivadoId: string, body: any, req: any): Promise<{
        message: string;
        muestra: any;
        nuevo_stock: number;
    }>;
}
