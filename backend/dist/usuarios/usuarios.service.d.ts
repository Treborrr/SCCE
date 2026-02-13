import { Pool } from 'pg';
export declare class UsuariosService {
    private pool;
    constructor(pool: Pool);
    findByEmail(email: string): Promise<any>;
    findById(id: string): Promise<any>;
    create(nombre: string, email: string, passwordHash: string, rol: string): Promise<any>;
}
