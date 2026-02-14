import { Pool } from 'pg';
export declare class CataService {
    private pool;
    constructor(pool: Pool);
    crearCata(muestraId: string, data: any, userId: string): Promise<{
        message: string;
        cata_id: any;
        tokens: string[];
    }>;
    responderCata(token: string, data: any): Promise<{
        message: string;
    }>;
}
