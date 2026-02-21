require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Tabla de análisis físicos
        await client.query(`
      CREATE TABLE IF NOT EXISTS analisis_fisicos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        muestra_id UUID REFERENCES muestras(id) ON DELETE CASCADE,
        fecha DATE NOT NULL,
        peso_muestra_gramos DECIMAL(10,2),
        humedad_porcentaje DECIMAL(5,2),
        foto_url TEXT,

        planos_gr DECIMAL(10,2) DEFAULT 0,
        materia_extrana_gr DECIMAL(10,2) DEFAULT 0,
        granos_menores_1gr_gr DECIMAL(10,2) DEFAULT 0,
        pasillas_gr DECIMAL(10,2) DEFAULT 0,
        multiples_gr DECIMAL(10,2) DEFAULT 0,
        germinados_gr DECIMAL(10,2) DEFAULT 0,

        numero_granos_evaluados INTEGER,
        peso_100_granos_gr DECIMAL(10,2),

        numero_grupos_50_granos INTEGER DEFAULT 0,

        created_by UUID,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
        console.log('✅ Tabla analisis_fisicos creada');

        // Tabla de grupos de prueba de corte
        await client.query(`
      CREATE TABLE IF NOT EXISTS analisis_fisico_grupos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        analisis_id UUID REFERENCES analisis_fisicos(id) ON DELETE CASCADE,
        numero_grupo INTEGER NOT NULL,
        fermentado INTEGER DEFAULT 0,
        violeta INTEGER DEFAULT 0,
        pizarroso INTEGER DEFAULT 0,
        hongos INTEGER DEFAULT 0,
        insectos INTEGER DEFAULT 0
      )
    `);
        console.log('✅ Tabla analisis_fisico_grupos creada');

        await client.query('COMMIT');
        console.log('\n✅ Migración completada');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
