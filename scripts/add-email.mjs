import { neon } from '@neondatabase/serverless';

const email = (process.argv[2] ?? '').trim().toLowerCase();
if (!email || !email.includes('@')) {
  console.error('Bruk: node --env-file=.env.local scripts/add-email.mjs ola@snekker.no');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL mangler. Kjør med: node --env-file=.env.local scripts/add-email.mjs <epost>');
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);
await sql.query(
  'insert into allowed_emails (email, added_by) values ($1, $2) on conflict (email) do nothing',
  [email, 'script'],
);
console.log('La til', email);
