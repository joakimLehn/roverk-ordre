import { neon } from '@neondatabase/serverless';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL mangler. Kjør: node --env-file=.env.local scripts/migrate.mjs');
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);
const dir = path.join(process.cwd(), 'db', 'migrations');
for (const f of readdirSync(dir).sort()) {
  if (!f.endsWith('.sql')) continue;
  console.log('Kjører', f);
  // Neon http-driver tar én statement per kall -> splitt på ';'
  for (const stmt of readFileSync(path.join(dir, f), 'utf8').split(';')) {
    const s = stmt.trim();
    if (s) await sql.query(s);
  }
}
console.log('Ferdig.');
