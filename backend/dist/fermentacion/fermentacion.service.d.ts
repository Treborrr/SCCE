import { Pool } from 'pg';
export declare class FermentacionService {
    private pool;
    constructor(pool: Pool);
    crearEvento(loteId: string, data: any, userId: string): Promise<{
        message: string;
        numeroRemocion: number | null;
    }>;
}
