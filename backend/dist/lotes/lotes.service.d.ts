import { Pool } from 'pg';
import { CreateLoteDto } from './dto/create-lote.dto';
export declare class LotesService {
    private pool;
    constructor(pool: Pool);
    create(dto: CreateLoteDto, userId: string): Promise<any>;
    findAll(): Promise<any[]>;
    findOne(id: string): Promise<any>;
    marcarListoFermentacion(id: string): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
