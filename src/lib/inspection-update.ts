import type { Inspection } from './inspection';

/** Kolonner denne appen kan UPDATE på inspections. Aldri interpoler andre nøkler i SQL. */
export const INSPECTION_EDITABLE_FIELDS = [
  'name',
  'phone',
  'email',
  'address',
  'scheduled_on',
  'scheduled_time',
  'status',
  'product',
  'channel',
  'notes',
] as const;

export type InspectionEditableField = (typeof INSPECTION_EDITABLE_FIELDS)[number];

/**
 * Nøkler som trygt kan interpoleres i UPDATE. Ukjente felt (id, created_at,
 * SQL-fragmenter) droppes – typed whitelist alene stopper ikke et Record
 * fra en action.
 */
export function inspectionUpdateKeys(
  fields: Partial<Pick<Inspection, InspectionEditableField>> | Record<string, unknown>,
): InspectionEditableField[] {
  const present = new Set(Object.keys(fields));
  return INSPECTION_EDITABLE_FIELDS.filter((k) => present.has(k));
}
