import { MuestrasService } from './muestras.service';
export declare class MuestrasController {
    private readonly muestrasService;
    constructor(muestrasService: MuestrasService);
    crearMuestra(loteId: string, body: any, req: any): Promise<{
        message: string;
        descuento_kg: number;
        nuevo_stock: number;
    }>;
}
