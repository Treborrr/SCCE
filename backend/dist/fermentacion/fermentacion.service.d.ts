import { Pool } from 'pg';
export declare class FermentacionService {
    private pool;
    constructor(pool: Pool);
    getLotesFermentacion(): Promise<any[]>;
    getEventos(loteId: string): Promise<any[]>;
    crearEvento(loteId: string, data: any, userId: string): Promise<{
        message: string;
        numeroRemocion: number | null;
    }>;
    actualizarFotoEvento(eventoId: string, fotoUrl: string, descripcion?: string): Promise<any>;
}
