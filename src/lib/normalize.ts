// Neon-driveren returnerer Date-objekter for timestamptz/date-kolonner.
// UI-et forventer strenger (og Date som React-barn krasjer), så alle rader
// normaliseres her før de forlater db-laget.
import type { Inspection, InspectionProduct, InspectionStatus } from './inspection';
import type { InspectionFile, InspectionFileKind } from './inspection-file';
import type { OrderFile, OrderFileKind } from './order-file';
import type { Order } from './types';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** timestamptz -> ISO-streng */
export function toIsoString(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

/** date -> 'YYYY-MM-DD'. Bruker lokale felter, ikke toISOString(), så dagen
 *  ikke forskyves når serverens tidssone ligger foran UTC. */
export function toDateString(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  return String(v).slice(0, 10);
}

export function normalizeOrder(row: Record<string, unknown>): Order {
  return {
    ...(row as unknown as Order),
    created_at: toIsoString(row.created_at) ?? '',
    invoiced_at: toIsoString(row.invoiced_at),
    paid_at: toIsoString(row.paid_at),
    preferred_date: toDateString(row.preferred_date),
    planned_build_date: toDateString(row.planned_build_date),
  };
}

/** time -> 'HH:MM'. Kutter sekunder fra Postgres time. */
export function toTimeString(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) return `${pad(v.getHours())}:${pad(v.getMinutes())}`;
  const s = String(v);
  const m = s.match(/^(\d{2}:\d{2})/);
  return m ? m[1] : null;
}

export function normalizeInspection(row: Record<string, unknown>): Inspection {
  const count = row.file_count;
  return {
    ...(row as unknown as Inspection),
    created_at: toIsoString(row.created_at) ?? '',
    updated_at: toIsoString(row.updated_at) ?? '',
    scheduled_on: toDateString(row.scheduled_on),
    scheduled_time: toTimeString(row.scheduled_time),
    product: (row.product as InspectionProduct | null) ?? null,
    status: (row.status as InspectionStatus) ?? 'aktiv',
    file_count: typeof count === 'number' ? count : Number(count ?? 0),
  };
}

export function normalizeInspectionFile(row: Record<string, unknown>): InspectionFile {
  const size = row.byte_size;
  return {
    ...(row as unknown as InspectionFile),
    created_at: toIsoString(row.created_at) ?? '',
    kind: row.kind as InspectionFileKind,
    byte_size: typeof size === 'number' ? size : size == null ? null : Number(size),
  };
}

export function normalizeOrderFile(row: Record<string, unknown>): OrderFile {
  const size = row.byte_size;
  return {
    ...(row as unknown as OrderFile),
    created_at: toIsoString(row.created_at) ?? '',
    kind: row.kind as OrderFileKind,
    byte_size: typeof size === 'number' ? size : size == null ? null : Number(size),
  };
}
