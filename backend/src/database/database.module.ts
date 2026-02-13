import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';

@Global()
@Module({
  providers: [
    {
      provide: 'PG_POOL',
      useFactory: async () => {
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: {
            rejectUnauthorized: false,
          },
        });

        return pool;
      },
    },
  ],
  exports: ['PG_POOL'],
})
export class DatabaseModule {}
console.log(process.env.DATABASE_URL);
