import { Pool } from 'pg';
export declare class MuestrasService {
    private pool;
    constructor(pool: Pool);
    crearMuestra(loteId: string, data: any, userId: string): Promise<{
        message: string;
        descuento_kg: number;
        nuevo_stock: number;
    }>;
}
