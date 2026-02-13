import { Pool } from 'pg';
export declare class SecadoService {
    private pool;
    constructor(pool: Pool);
    finalizarSecado(loteId: string, data: any, userId: string): Promise<{
        message: string;
    }>;
}
