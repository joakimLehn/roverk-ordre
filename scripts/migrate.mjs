import { neon } from '@neondatabase/serverless';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL mangler. Lokalt: npm run db:migrate (leser .env.local).');
  process.exit(1);
}

// Skriv alltid ut hvilken base vi snakker med. En migrering mot feil base er
// den dyreste feilen dette skriptet kan gjøre, og feilmeldingen fra Postgres
// («relation "orders" does not exist») sier ikke hvilken base den kom fra.
const { host, pathname } = new URL(url);
console.log(`Base: ${host}${pathname}`);

// `node --env-file` overskriver IKKE variabler som allerede finnes i miljøet.
// Er DATABASE_URL eksportert i shellet, blir .env.local stille ignorert, og
// migreringene treffer en helt annen base enn den utvikleren tror.
const envFile = path.join(process.cwd(), '.env.local');
if (existsSync(envFile)) {
  const match = readFileSync(envFile, 'utf8').match(/^DATABASE_URL=(.*)$/m);
  const fromFile = match?.[1].trim().replace(/^["']|["']$/g, '');
  if (fromFile && fromFile !== url) {
    let fileHost = fromFile;
    try {
      fileHost = new URL(fromFile).host;
    } catch {
      // Ugyldig URL i filen. Vi printer aldri rå verdier, så vi sier bare fra.
      fileHost = '(uleselig verdi)';
    }
    console.error(`\nAVBRUTT: .env.local peker på ${fileHost}, miljøet peker på ${host}.`);
    console.error('Miljøvariabelen vinner over --env-file. Kjør på nytt med:');
    console.error('  env -u DATABASE_URL npm run db:migrate');
    process.exit(1);
  }
}

const sql = neon(url);

// Migreringene forutsetter nettsidens `orders`. Finnes den ikke, er dette
// ikke den delte basen, og vi skal ikke opprette noe her.
const [{ finnes }] = await sql`select to_regclass('public.orders') is not null as finnes`;
if (!finnes) {
  console.error(`\nAVBRUTT: fant ingen public.orders i ${host}${pathname}.`);
  console.error('Migreringene skal kjøre mot Neon-basen appen deler med roverk.no.');
  console.error('Sjekk DATABASE_URL – den peker et annet sted.');
  process.exit(1);
}

await sql`create table if not exists schema_migrations (
  filename   text primary key,
  checksum   text not null,
  applied_at timestamptz not null default now()
)`;

const kjort = new Map(
  (await sql`select filename, checksum from schema_migrations`).map((r) => [r.filename, r.checksum]),
);

const dir = path.join(process.cwd(), 'db', 'migrations');
let nye = 0;
let hoppet = 0;

for (const f of readdirSync(dir).sort()) {
  if (!f.endsWith('.sql')) continue;

  const body = readFileSync(path.join(dir, f), 'utf8');
  const checksum = createHash('sha256').update(body).digest('hex');
  const forrige = kjort.get(f);

  if (forrige === checksum) {
    console.log('Hopper over', f);
    hoppet++;
    continue;
  }
  if (forrige) {
    console.error(`\nAVBRUTT: ${f} er endret etter at den ble kjørt.`);
    console.error('Legg endringen i en ny migreringsfil i stedet for å redigere en kjørt.');
    process.exit(1);
  }

  console.log('Kjører', f);
  // Neon http-driver tar én statement per kall -> splitt på ';'. Tåler ikke
  // ';' inne i strenger eller $$-kropper; hold migreringene enkle.
  for (const stmt of body.split(';')) {
    const s = stmt.trim();
    if (s) await sql.query(s);
  }
  // Ingen transaksjon rundt fil + ledger (http-driveren har ingen). Feiler den
  // midt i, mangler raden, og filen kjøres om igjen – derfor er kravet om
  // idempotente migreringer fortsatt i kraft.
  await sql`insert into schema_migrations (filename, checksum) values (${f}, ${checksum})`;
  nye++;
}

console.log(`Ferdig. ${nye} kjørt, ${hoppet} hoppet over.`);
