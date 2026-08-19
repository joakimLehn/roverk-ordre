import type { Order } from './types';
import { ageInDays } from './age';

/**
 * Sortering av ordretabellen på skrivebord.
 *
 * Lista var før alltid `created_at desc`. Den som gjør faktureringsrunden
 * trenger å kunne stille andre spørsmål – hvem har ventet lengst, hva er
 * dyrest, hva skal bygges først.
 *
 * Retningen ligger i URL-en som et minusprefiks (`-pris`), så tilstanden er
 * delbar og tåler en full sidelast.
 */
export type SortKey = 'alder' | 'pris' | 'byggedato' | 'kunde';

interface SortColumn {
  key: SortKey;
  label: string;
  /** Retningen kolonnen er mest nyttig i når man nettopp valgte den. */
  descFirst: boolean;
}

export const SORT_COLUMNS: SortColumn[] = [
  { key: 'alder', label: 'Alder', descFirst: true },
  { key: 'kunde', label: 'Kunde', descFirst: false },
  { key: 'pris', label: 'Pris', descFirst: true },
  { key: 'byggedato', label: 'Byggedato', descFirst: false },
];

const BY_KEY = new Map(SORT_COLUMNS.map((c) => [c.key, c]));

export function isSortKey(v: unknown): v is SortKey {
  return typeof v === 'string' && BY_KEY.has(v as SortKey);
}

export interface Sort {
  key: SortKey;
  desc: boolean;
}

const DEFAULT_SORT: Sort = { key: 'alder', desc: true };

export function parseSort(param: string | undefined): Sort {
  if (!param) return DEFAULT_SORT;
  const desc = param.startsWith('-');
  const key = desc ? param.slice(1) : param;
  return isSortKey(key) ? { key, desc } : DEFAULT_SORT;
}

/** Verdien som skal i URL-en når en kolonneoverskrift trykkes. */
export function toggleSort(current: string | undefined, key: SortKey): string {
  const active = parseSort(current);
  if (active.key === key) return active.desc ? key : `-${key}`;
  return BY_KEY.get(key)!.descFirst ? `-${key}` : key;
}

const collator = new Intl.Collator('nb-NO', { sensitivity: 'base' });

export function sortOrders(orders: Order[], param: string | undefined, now: string): Order[] {
  const { key, desc } = parseSort(param);
  const dir = desc ? -1 : 1;

  return [...orders].sort((a, b) => {
    switch (key) {
      case 'pris':
        return dir * ((a.price_nok ?? 0) - (b.price_nok ?? 0));
      case 'kunde':
        return dir * collator.compare(a.name, b.name);
      case 'byggedato': {
        // Ordrer uten byggedato hører nederst i begge retninger – de er ikke
        // «tidligst» bare fordi feltet er tomt.
        if (!a.planned_build_date && !b.planned_build_date) return 0;
        if (!a.planned_build_date) return 1;
        if (!b.planned_build_date) return -1;
        return dir * a.planned_build_date.localeCompare(b.planned_build_date);
      }
      case 'alder':
      default:
        return dir * (ageInDays(a.created_at, now) - ageInDays(b.created_at, now));
    }
  });
}
