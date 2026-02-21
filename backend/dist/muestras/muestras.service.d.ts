import { Pool } from 'pg';
export declare class MuestrasService {
    private pool;
    constructor(pool: Pool);
    obtenerLotesEnAlmacen(): Promise<any[]>;
    listarMuestras(): Promise<any[]>;
    crearMuestra(loteId: string, data: any, userId: string): Promise<{
        message: string;
        muestra: any;
        descuento_kg: number;
        nuevo_stock: number;
    }>;
    obtenerAnalisis(muestraId: string): Promise<any[]>;
    crearAnalisis(muestraId: string, data: any, userId: string): Promise<{
        message: string;
        analisis: any;
    }>;
}
