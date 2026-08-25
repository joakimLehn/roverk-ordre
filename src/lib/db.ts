import 'server-only';
import { neon } from '@neondatabase/serverless';
import type { Inspection } from './inspection';
import type { InspectionFile, InspectionFileKind } from './inspection-file';
import { inspectionUpdateKeys, type InspectionEditableField } from './inspection-update';
import { normalizeInspection, normalizeInspectionFile, normalizeOrder, normalizeOrderFile } from './normalize';
import type { OrderFile } from './order-file';
import type { Order } from './types';

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

const INSPECTION_COLS = `id, created_at, created_by, name, phone, email, address,
  scheduled_on, scheduled_time, status, product, channel, notes, updated_at`;

const INSPECTION_FILE_COUNT = `(select count(*)::int from inspection_files f where f.inspection_id = inspections.id) as file_count`;

const INSPECTION_FILE_COLS = `id, inspection_id, created_at, created_by, kind, filename,
  content_type, byte_size, blob_pathname, subject, body_text`;

export async function listInspections(): Promise<Inspection[]> {
  const rows = (await sql().query(
    `select ${INSPECTION_COLS}, ${INSPECTION_FILE_COUNT}
     from inspections
     order by created_at desc`,
  )) as Record<string, unknown>[];
  return rows.map(normalizeInspection);
}

export async function getInspection(id: string): Promise<Inspection | null> {
  const rows = (await sql().query(
    `select ${INSPECTION_COLS}, ${INSPECTION_FILE_COUNT}
     from inspections where id = $1`,
    [id],
  )) as Record<string, unknown>[];
  return rows[0] ? normalizeInspection(rows[0]) : null;
}

export interface NewInspection {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  scheduled_on: string | null;
  scheduled_time: string | null;
  status?: Inspection['status'];
  product: Inspection['product'];
  channel: string | null;
  notes: string | null;
  created_by: string | null;
}

export async function insertInspection(data: NewInspection): Promise<string> {
  const rows = (await sql().query(
    `insert into inspections
       (name, phone, email, address, scheduled_on, scheduled_time, status, product, channel, notes, created_by)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     returning id`,
    [
      data.name, data.phone, data.email, data.address, data.scheduled_on, data.scheduled_time,
      data.status ?? 'aktiv', data.product, data.channel, data.notes, data.created_by,
    ],
  )) as { id: string }[];
  return rows[0].id;
}

export async function updateInspectionFields(
  id: string,
  fields: Partial<Pick<Inspection, InspectionEditableField>>,
): Promise<void> {
  const keys = inspectionUpdateKeys(fields);
  if (keys.length === 0) return;
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  await sql().query(
    `update inspections set ${sets}, updated_at = now() where id = $1`,
    [id, ...keys.map((k) => fields[k] ?? null)],
  );
}

export async function deleteInspection(id: string): Promise<void> {
  await sql().query('delete from inspections where id = $1', [id]);
}

export async function listInspectionFiles(inspectionId: string): Promise<InspectionFile[]> {
  const rows = (await sql().query(
    `select ${INSPECTION_FILE_COLS}
     from inspection_files
     where inspection_id = $1
     order by created_at asc`,
    [inspectionId],
  )) as Record<string, unknown>[];
  return rows.map(normalizeInspectionFile);
}

export async function getInspectionFile(id: string): Promise<InspectionFile | null> {
  const rows = (await sql().query(
    `select ${INSPECTION_FILE_COLS} from inspection_files where id = $1`,
    [id],
  )) as Record<string, unknown>[];
  return rows[0] ? normalizeInspectionFile(rows[0]) : null;
}

export async function countInspectionFiles(inspectionId: string): Promise<number> {
  const rows = (await sql().query(
    'select count(*)::int as n from inspection_files where inspection_id = $1',
    [inspectionId],
  )) as { n: number }[];
  return Number(rows[0]?.n ?? 0);
}

export interface NewInspectionFile {
  inspection_id: string;
  created_by: string | null;
  kind: InspectionFileKind;
  filename: string;
  content_type: string | null;
  byte_size: number | null;
  blob_pathname: string | null;
  subject: string | null;
  body_text: string | null;
}

export async function insertInspectionFile(data: NewInspectionFile): Promise<string> {
  const rows = (await sql().query(
    `insert into inspection_files
       (inspection_id, created_by, kind, filename, content_type, byte_size, blob_pathname, subject, body_text)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     returning id`,
    [
      data.inspection_id, data.created_by, data.kind, data.filename, data.content_type,
      data.byte_size, data.blob_pathname, data.subject, data.body_text,
    ],
  )) as { id: string }[];
  return rows[0].id;
}

export async function deleteInspectionFile(id: string): Promise<void> {
  await sql().query('delete from inspection_files where id = $1', [id]);
}

const ORDER_FILE_COLS = `id, order_id, created_at, created_by, kind, filename,
  content_type, byte_size, blob_pathname`;

export async function listOrderFiles(orderId: string): Promise<OrderFile[]> {
  const rows = (await sql().query(
    `select ${ORDER_FILE_COLS}
     from order_files
     where order_id = $1
     order by created_at asc`,
    [orderId],
  )) as Record<string, unknown>[];
  return rows.map(normalizeOrderFile);
}

export async function getOrderFile(id: string): Promise<OrderFile | null> {
  const rows = (await sql().query(
    `select ${ORDER_FILE_COLS} from order_files where id = $1`,
    [id],
  )) as Record<string, unknown>[];
  return rows[0] ? normalizeOrderFile(rows[0]) : null;
}

export async function countOrderFiles(orderId: string): Promise<number> {
  const rows = (await sql().query(
    'select count(*)::int as n from order_files where order_id = $1',
    [orderId],
  )) as { n: number }[];
  return Number(rows[0]?.n ?? 0);
}

export interface NewOrderFile {
  order_id: string;
  created_by: string | null;
  kind: OrderFile['kind'];
  filename: string;
  content_type: string | null;
  byte_size: number | null;
  blob_pathname: string;
}

export async function insertOrderFile(data: NewOrderFile): Promise<string> {
  const rows = (await sql().query(
    `insert into order_files
       (order_id, created_by, kind, filename, content_type, byte_size, blob_pathname)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning id`,
    [
      data.order_id, data.created_by, data.kind, data.filename, data.content_type,
      data.byte_size, data.blob_pathname,
    ],
  )) as { id: string }[];
  return rows[0].id;
}

export async function deleteOrderFile(id: string): Promise<void> {
  await sql().query('delete from order_files where id = $1', [id]);
}
