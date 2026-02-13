import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { Pool } from 'pg';

@Controller()
export class AppController {
  constructor(@Inject('PG_POOL') private pool: Pool) {}

  @Get('test-db')
  async testDb(){
    const result = await this.pool.query('SELECT NOW()');
    return result.rows;
  }
}
