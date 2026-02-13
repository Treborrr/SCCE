import { Injectable, Inject  } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateLoteDto } from './dto/create-lote.dto';

@Injectable()
export class LotesService {
  constructor(@Inject('PG_POOL') private pool: Pool) {}
  async findAll(){
    const result = await this.pool.query('SELECT * FROM lotes');
    return result.rows;
  }
  
  async create(dto: CreateLoteDto) {
    const query = `
      INSERT INTO lotes (
        id,
        codigo,
        fecha_compra,
        kg_baba_compra,
        kg_segunda,
        estado,
        created_at
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        $4,
        'INGRESADO',
        NOW()
      )
      RETURNING *;
    `;

    const values = [
      dto.codigo,
      dto.fecha_compra,
      dto.kg_baba_compra,
      dto.kg_segunda || 0
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }
}
