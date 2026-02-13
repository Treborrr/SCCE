import { SecadoService } from './secado.service';
export declare class SecadoController {
    private readonly secadoService;
    constructor(secadoService: SecadoService);
    finalizarSecado(loteId: string, body: any, req: any): Promise<{
        message: string;
    }>;
}
