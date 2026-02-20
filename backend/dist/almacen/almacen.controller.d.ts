import { AlmacenService } from './almacen.service';
export declare class AlmacenController {
    private readonly almacenService;
    constructor(almacenService: AlmacenService);
    getLotesFermentacion(): Promise<any[]>;
    ingresarAlmacen(loteId: string, body: any, req: any): Promise<{
        message: string;
        kg_neto: number;
        rendimiento: number;
    }>;
}
