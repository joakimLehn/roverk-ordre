// Neon-driveren returnerer Date-objekter for timestamptz/date-kolonner.
// UI-et forventer strenger (og Date som React-barn krasjer), så alle rader
// normaliseres her før de forlater db-laget.
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
