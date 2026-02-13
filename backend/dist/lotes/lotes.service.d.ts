import { Pool } from 'pg';
import { CreateLoteDto } from './dto/create-lote.dto';
export declare class LotesService {
    private pool;
    constructor(pool: Pool);
    findAll(): Promise<any[]>;
    create(dto: CreateLoteDto): Promise<any>;
}
