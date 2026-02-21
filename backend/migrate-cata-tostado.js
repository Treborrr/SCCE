require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function migrate() {
    // Add tostado columns to catas
    await p.query(`ALTER TABLE catas ADD COLUMN IF NOT EXISTS temperatura numeric`);
    await p.query(`ALTER TABLE catas ADD COLUMN IF NOT EXISTS tiempo numeric`);
    await p.query(`ALTER TABLE catas ADD COLUMN IF NOT EXISTS tostadora varchar(255)`);
    console.log('Added temperatura, tiempo, tostadora to catas');

    await p.end();
}
migrate().catch(e => { console.error(e.message); p.end(); });
