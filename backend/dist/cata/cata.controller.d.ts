import { CataService } from './cata.service';
export declare class CataController {
    private readonly cataService;
    constructor(cataService: CataService);
    listarCatas(muestraId: string): Promise<any[]>;
    crearCata(muestraId: string, body: any, req: any): Promise<{
        message: string;
        cata_id: any;
        links: any[];
    }>;
    obtenerInvitacion(token: string): Promise<any>;
    responderCata(token: string, body: any): Promise<{
        message: string;
    }>;
    obtenerResultados(cataId: string): Promise<any[]>;
}
