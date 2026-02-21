require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
  // List all enums
  const enums = await p.query(`
    SELECT t.typname, e.enumlabel 
    FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid 
    WHERE t.typname LIKE '%estado%' OR t.typname LIKE '%lote%'
    ORDER BY t.typname, e.enumsortorder
  `);
  console.log('Enums:');
  enums.rows.forEach(r => console.log(`  ${r.typname}: ${r.enumlabel}`));

  // Check lotes column type
  const col = await p.query(`
    SELECT column_name, udt_name FROM information_schema.columns 
    WHERE table_name = 'lotes' AND column_name = 'estado'
  `);
  console.log('\nlotes.estado column type:', col.rows[0]?.udt_name);

  await p.end();
}
check().catch(e => { console.error(e.message); p.end(); });
