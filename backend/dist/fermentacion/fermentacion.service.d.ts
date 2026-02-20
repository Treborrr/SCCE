import { Pool } from 'pg';
export declare class FermentacionService {
    private pool;
    constructor(pool: Pool);
    getLotesFermentacion(): Promise<any[]>;
    getEventos(loteId: string): Promise<any[]>;
    registrarEvento(loteId: string, dto: any, userId: string): Promise<{
        message: string;
    }>;
    crearEvento(loteId: string, data: any, userId: string): Promise<{
        message: string;
        numeroRemocion: number | null;
    }>;
}
