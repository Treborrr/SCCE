import { CataService } from './cata.service';
export declare class CataController {
    private readonly cataService;
    constructor(cataService: CataService);
    crearCata(muestraId: string, body: any, req: any): Promise<{
        message: string;
        cata_id: any;
        tokens: string[];
    }>;
    responderCata(cataId: string, body: any): Promise<{
        message: string;
    }>;
}
