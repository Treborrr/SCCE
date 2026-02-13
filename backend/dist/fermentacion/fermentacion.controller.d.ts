import { FermentacionService } from './fermentacion.service';
export declare class FermentacionController {
    private readonly fermentacionService;
    constructor(fermentacionService: FermentacionService);
    crearEvento(loteId: string, body: any, req: any): Promise<{
        message: string;
        numeroRemocion: number | null;
    }>;
}
