import { Pool } from 'pg';
export declare class CataService {
    private pool;
    constructor(pool: Pool);
    listarCatas(muestraId: string): Promise<any[]>;
    crearCata(muestraId: string, data: any, userId: string): Promise<{
        message: string;
        cata_id: any;
        links: any[];
    }>;
    obtenerInvitacion(token: string): Promise<any>;
    responderCata(token: string, data: any): Promise<{
        message: string;
    }>;
    obtenerResultados(cataId: string): Promise<any[]>;
}
