import { SecadoService } from './secado.service';
export declare class SecadoController {
    private readonly secadoService;
    constructor(secadoService: SecadoService);
    obtenerLotesEnSecado(): Promise<any[]>;
    obtenerEventos(loteId: string): Promise<import("pg").QueryResult<any>>;
    finalizarSecado(loteId: string, body: any, req: any): Promise<{
        message: string;
    }>;
}
