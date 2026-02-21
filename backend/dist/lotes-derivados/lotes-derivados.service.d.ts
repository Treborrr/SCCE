import { Pool } from 'pg';
import { CreateDerivadoDto } from './dto/create-derivado.dto';
export declare class LotesDerivadosService {
    private pool;
    constructor(pool: Pool);
    obtenerLotesDisponibles(): Promise<any[]>;
    listarDerivados(): Promise<any[]>;
    crearDerivado(dto: CreateDerivadoDto, userId: string): Promise<{
        message: string;
        lote_derivado_id: `${string}-${string}-${string}-${string}-${string}`;
        codigo: string;
        stock_total: number;
    }>;
    crearMuestra(derivadoId: string, data: any, userId: string): Promise<{
        message: string;
        muestra: any;
        nuevo_stock: number;
    }>;
}
