import { Pool } from 'pg';
export declare class SecadoService {
    private pool;
    constructor(pool: Pool);
    obtenerLotesEnSecado(): Promise<any[]>;
    obtenerSecado(loteId: string): Promise<any>;
    obtenerEventos(loteId: string): Promise<import("pg").QueryResult<any>>;
    finalizarSecado(loteId: string, data: any, userId: string): Promise<{
        message: string;
    }>;
}
