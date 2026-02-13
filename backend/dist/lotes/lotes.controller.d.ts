import { LotesService } from './lotes.service';
export declare class LotesController {
    private readonly lotesService;
    constructor(lotesService: LotesService);
    findAll(): Promise<any[]>;
    create(body: any): Promise<any>;
}
