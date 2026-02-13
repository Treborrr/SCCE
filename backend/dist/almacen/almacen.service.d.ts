import { Pool } from 'pg';
export declare class AlmacenService {
    private pool;
    constructor(pool: Pool);
    ingresarAlmacen(loteId: string, data: any, userId: string): Promise<{
        message: string;
        kg_neto: number;
        rendimiento: number;
    }>;
}
