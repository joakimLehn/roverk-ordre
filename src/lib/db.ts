import 'server-only';
import { neon } from '@neondatabase/serverless';
import type { Order } from './types';
import { normalizeOrder } from './normalize';

let _sql: ReturnType<typeof neon> | null = null;
function sql() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL!);
  return _sql;
}

const ORDER_COLS = `id, created_at, site, product, config, preferred_date, name, phone,
  email, address, address_meta, price_nok, build_status, invoiced_at, paid_at,
  is_test, planned_build_date, internal_notes`;

export async function listOrders(limit = 300): Promise<Order[]> {
  const rows = (await sql().query(
    `select ${ORDER_COLS} from orders order by created_at desc limit $1`,
    [limit],
  )) as Record<string, unknown>[];
  return rows.map(normalizeOrder);
}

export async function getOrder(id: string): Promise<Order | null> {
  const rows = (await sql().query(
    `select ${ORDER_COLS} from orders where id = $1`,
    [id],
  )) as Record<string, unknown>[];
  return rows[0] ? normalizeOrder(rows[0]) : null;
}

// Kolonnenavn interpoleres kun fra denne typed whitelisten – aldri brukerinput.
type EditableField =
  | 'build_status' | 'invoiced_at' | 'paid_at' | 'is_test'
  | 'planned_build_date' | 'internal_notes'
  | 'name' | 'phone' | 'email' | 'address' | 'preferred_date';

export async function updateOrderFields(
  id: string,
  fields: Partial<Pick<Order, EditableField>>,
): Promise<void> {
  const keys = Object.keys(fields) as EditableField[];
  if (keys.length === 0) return;
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  await sql().query(
    `update orders set ${sets} where id = $1`,
    [id, ...keys.map((k) => fields[k] ?? null)],
  );
}

/**
 * Marker flere ordrer som fakturert i én skriving.
 *
 * Faktureringsrunden er per definisjon en bunke: «montert, ikke fakturert» er
 * en stabel man går gjennom. Ett kall i stedet for N sparer både rundturer og
 * N revalideringer av hele lista.
 *
 * Ordrer som alt er fakturert røres ikke – tidsstempelet skal ikke flyttes av
 * at noen tok med hele lista.
 */
export async function setOrdersInvoiced(ids: string[], at: string | null): Promise<number> {
  if (ids.length === 0) return 0;
  // Ingen cast på id: `orders` eies av nettsiden, så kolonnetypen er ikke vår
  // å anta. En parameterisert IN-liste virker uansett type – og id-ene er
  // fortsatt bundne parametere, aldri interpolert tekst.
  const placeholders = ids.map((_, i) => `$${i + 2}`).join(', ');
  const rows = (await sql().query(
    `update orders set invoiced_at = $1
     where id in (${placeholders})
       and invoiced_at is ${at === null ? 'not null' : 'null'}
     returning id`,
    [at, ...ids],
  )) as { id: string }[];
  return rows.length;
}

export interface NewManualOrder {
  site: string;
  product: string | null;
  config: Record<string, unknown>;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  price_nok: number | null;
  preferred_date: string | null;
  internal_notes: string | null;
}

export async function updateOrderBestilling(
  id: string,
  b: { config: Record<string, unknown>; product: string; price_nok: number | null },
): Promise<void> {
  await sql().query(
    `update orders set config = $2::jsonb, product = $3, price_nok = $4 where id = $1`,
    [id, JSON.stringify(b.config), b.product, b.price_nok],
  );
}

export async function insertManualOrder(o: NewManualOrder): Promise<string> {
  const rows = (await sql().query(
    `insert into orders (site, product, config, name, phone, email, address, price_nok, preferred_date, internal_notes)
     values ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, $9, $10)
     returning id`,
    [o.site, o.product, JSON.stringify(o.config), o.name, o.phone, o.email,
     o.address, o.price_nok, o.preferred_date, o.internal_notes],
  )) as { id: string }[];
  return rows[0].id;
}

export async function isEmailAllowed(email: string): Promise<boolean> {
  const rows = (await sql().query(
    'select 1 from allowed_emails where email = $1',
    [email],
  )) as unknown[];
  return rows.length > 0;
}
