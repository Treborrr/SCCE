import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class UsuariosService {
  constructor(@Inject('PG_POOL') private pool: Pool) {}

  async findByEmail(email: string) {
    const result = await this.pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND activo = true',
      [email],
    );
    return result.rows[0];
  }

  async findById(id: string) {
    const result = await this.pool.query(
      'SELECT id, nombre, email, rol FROM usuarios WHERE id = $1 AND activo = true',
      [id],
    );
    return result.rows[0];
  }

  async create(nombre: string, email: string, passwordHash: string, rol: string) {
    const result = await this.pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, email, rol`,
      [nombre, email, passwordHash, rol],
    );
    return result.rows[0];
  }
}