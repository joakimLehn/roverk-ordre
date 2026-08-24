import { BUILD_GROUP_ORDER, buildGroupOf, type BuildGroupKey } from './groups';
import type { Inspection } from './inspection';

/**
 * Datobøtter for kommende befaringer. Samme nøkler og ukesregning som
 * `groupByBuildDate`, men egen funksjon – ordrer skal ikke få union-typer.
 */
export type InspectionGroupKey = BuildGroupKey;

export const INSPECTION_GROUP_ORDER: InspectionGroupKey[] = BUILD_GROUP_ORDER;

export const INSPECTION_GROUP_LABELS: Record<InspectionGroupKey, string> = {
  forfalt: 'Forfalt',
  i_dag: 'I dag',
  uka: 'Denne uka',
  senere: 'Senere',
  ingen: 'Uten dato',
};

export function inspectionGroupOf(scheduledOn: string | null, today: string): InspectionGroupKey {
  return buildGroupOf(scheduledOn, today);
}

export interface InspectionGroup {
  key: InspectionGroupKey;
  label: string;
  inspections: Inspection[];
}

function compareTime(a: string | null, b: string | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a.localeCompare(b);
}

/**
 * Grupperer kommende befaringer på avtalt dato. Innenfor gruppe: tidligste
 * `scheduled_on`, så tidligste klokke (`null` sist), så `created_at`.
 */
export function groupInspectionsByDate(items: Inspection[], today: string): InspectionGroup[] {
  const buckets = new Map<InspectionGroupKey, Inspection[]>();
  for (const item of items) {
    const key = inspectionGroupOf(item.scheduled_on, today);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(item);
    else buckets.set(key, [item]);
  }

  return INSPECTION_GROUP_ORDER.filter((key) => buckets.has(key)).map((key) => ({
    key,
    label: INSPECTION_GROUP_LABELS[key],
    inspections: buckets.get(key)!.sort((a, b) => {
      const byDate = (a.scheduled_on ?? '').localeCompare(b.scheduled_on ?? '');
      if (byDate !== 0) return byDate;
      const byTime = compareTime(a.scheduled_time, b.scheduled_time);
      if (byTime !== 0) return byTime;
      return a.created_at.localeCompare(b.created_at);
    }),
  }));
}
