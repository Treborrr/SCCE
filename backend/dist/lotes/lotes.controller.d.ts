import { LotesService } from './lotes.service';
import { CreateLoteDto } from './dto/create-lote.dto';
export declare class LotesController {
    private readonly lotesService;
    constructor(lotesService: LotesService);
    findAll(): Promise<any[]>;
    create(dto: CreateLoteDto, req: any): Promise<any>;
}
