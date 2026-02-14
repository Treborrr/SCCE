import { Pool } from 'pg';
import { CreateDerivadoDto } from './dto/create-derivado.dto';
export declare class LotesDerivadosService {
    private pool;
    constructor(pool: Pool);
    crearDerivado(dto: CreateDerivadoDto, userId: string): Promise<{
        message: string;
        lote_derivado_id: `${string}-${string}-${string}-${string}-${string}`;
        stock_total: number;
    }>;
}
