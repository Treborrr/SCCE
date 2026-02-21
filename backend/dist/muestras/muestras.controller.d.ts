import { MuestrasService } from './muestras.service';
export declare class MuestrasController {
    private readonly muestrasService;
    constructor(muestrasService: MuestrasService);
    obtenerLotesEnAlmacen(): Promise<any[]>;
    listarMuestras(): Promise<any[]>;
    crearMuestra(loteId: string, body: any, req: any): Promise<{
        message: string;
        muestra: any;
        descuento_kg: number;
        nuevo_stock: number;
    }>;
    obtenerAnalisis(muestraId: string): Promise<any[]>;
    crearAnalisis(muestraId: string, body: any, req: any): Promise<{
        message: string;
        analisis: any;
    }>;
    uploadFoto(file: any): {
        foto_url: string;
    };
}
