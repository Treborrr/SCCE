import { FermentacionService } from './fermentacion.service';
export declare class FermentacionController {
    private readonly fermentacionService;
    constructor(fermentacionService: FermentacionService);
    getLotesFermentacion(): Promise<any[]>;
    getEventos(loteId: string): Promise<any[]>;
    crearEvento(loteId: string, body: any, req: any): Promise<{
        message: string;
        numeroRemocion: number | null;
    }>;
}
