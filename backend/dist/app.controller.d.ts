import { Pool } from 'pg';
export declare class AppController {
    private pool;
    constructor(pool: Pool);
    testDb(): Promise<any[]>;
}
