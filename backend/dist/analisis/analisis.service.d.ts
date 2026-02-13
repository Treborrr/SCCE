import { Pool } from 'pg';
export declare class AnalisisService {
    private pool;
    constructor(pool: Pool);
    crearAnalisisFisico(muestraId: string, data: any, userId: string): Promise<{
        message: string;
        analisis_id: any;
    }>;
}
