// Script para recalcular stock_actual de lotes que quedaron con NaN
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function fix() {
    const client = await pool.connect();
    try {
        // Buscar lotes en ALMACEN con stock_actual null o NaN
        const lotes = await client.query(`
      SELECT l.id, l.codigo, l.stock_actual, l.kg_neto_final
      FROM lotes l
      WHERE l.estado = 'ALMACEN'
    `);

        console.log('Lotes en ALMACEN:', lotes.rows.length);

        for (const lote of lotes.rows) {
            console.log(`\nLote ${lote.codigo}: stock_actual=${lote.stock_actual}, kg_neto_final=${lote.kg_neto_final}`);

            if (lote.stock_actual === null || isNaN(Number(lote.stock_actual))) {
                // Obtener total de muestras descontadas
                const muestras = await client.query(`
          SELECT COALESCE(SUM(peso_muestra_gramos), 0) as total_gramos
          FROM muestras
          WHERE lote_id = $1
        `, [lote.id]);

                const totalDescontadoKg = Number(muestras.rows[0].total_gramos) / 1000;
                const nuevoStock = Number(lote.kg_neto_final) - totalDescontadoKg;

                console.log(`  → Total muestras: ${totalDescontadoKg} kg`);
                console.log(`  → Nuevo stock: ${lote.kg_neto_final} - ${totalDescontadoKg} = ${nuevoStock}`);

                await client.query(
                    'UPDATE lotes SET stock_actual = $1 WHERE id = $2',
                    [nuevoStock, lote.id]
                );

                console.log(`  ✅ Stock corregido a ${nuevoStock} kg`);
            } else {
                console.log('  → Stock OK');
            }
        }

        console.log('\n✅ Corrección completada');
    } finally {
        client.release();
        await pool.end();
    }
}

fix().catch(console.error);
