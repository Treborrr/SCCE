import { AnalisisService } from './analisis.service';
export declare class AnalisisController {
    private readonly analisisService;
    constructor(analisisService: AnalisisService);
    crearAnalisisFisico(muestraId: string, body: any, req: any): Promise<{
        message: string;
        analisis_id: any;
    }>;
}
