require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function migrate() {
    const client = await p.connect();
    try {
        await client.query('BEGIN');

        // Agregar campos faltantes a catas
        await client.query(`ALTER TABLE catas ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'ABIERTA'`);
        await client.query(`ALTER TABLE catas ADD COLUMN IF NOT EXISTS fecha DATE`);
        await client.query(`ALTER TABLE catas ADD COLUMN IF NOT EXISTS tipo_tueste VARCHAR(100)`);

        // Agregar campos faltantes a cata_respuestas
        await client.query(`ALTER TABLE cata_respuestas ADD COLUMN IF NOT EXISTS fecha DATE`);
        await client.query(`ALTER TABLE cata_respuestas ADD COLUMN IF NOT EXISTS tipo_tueste VARCHAR(100)`);

        await client.query('COMMIT');
        console.log('✅ Columnas agregadas correctamente');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error:', e.message);
    } finally {
        client.release();
        await p.end();
    }
}
migrate();
