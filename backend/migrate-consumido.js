require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function migrate() {
    // Add CONSUMIDO to enum
    await p.query(`ALTER TYPE estado_lote ADD VALUE IF NOT EXISTS 'CONSUMIDO'`);
    console.log('CONSUMIDO added to estado_lote enum');

    // Update lots with 0 stock that are in ALMACEN
    const result = await p.query(`UPDATE lotes SET estado = 'CONSUMIDO' WHERE estado = 'ALMACEN' AND stock_actual <= 0`);
    console.log('Updated', result.rowCount, 'lots to CONSUMIDO');

    await p.end();
}
migrate().catch(e => { console.error(e.message); p.end(); });
