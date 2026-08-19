import type { Order } from './types';

// Forhåndsdefinerte visninger. På mobil erstatter disse filterpanelet for de
// to spørsmålene som faktisk stilles ute i felt.
export type ViewKey = 'bygge' | 'fakturere' | 'alle';

export const VIEWS: { key: ViewKey; label: string }[] = [
  { key: 'bygge', label: 'Å bygge' },
  { key: 'fakturere', label: 'Å fakturere' },
  { key: 'alle', label: 'Alle' },
];

export function isViewKey(v: unknown): v is ViewKey {
  return v === 'bygge' || v === 'fakturere' || v === 'alle';
}

export function applyView(orders: Order[], view: ViewKey): Order[] {
  if (view === 'bygge') return orders.filter((o) => o.build_status !== 'montert');
  if (view === 'fakturere') return orders.filter((o) => o.build_status === 'montert' && !o.invoiced_at);
  return orders;
}

/**
 * Lenka til en visning, med aktive filtre i behold. Både fanene på skrivebord
 * og bunnlinja på mobil bruker denne, så de aldri kan drifte fra hverandre.
 *
 * `valgt` (ordren som er åpen i sidepanelet) tas bevisst ikke med – den hører
 * til den lista du forlater.
 */
export function viewHref(key: ViewKey, params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v && k !== 'view' && k !== 'valgt') sp.set(k, v);
  }
  if (key !== 'bygge') sp.set('view', key);
  const q = sp.toString();
  return q ? `/?${q}` : '/';
}

/**
 * Lista med én eller flere parametere endret. Brukes til sortering og til å
 * peke på ordren som skal stå i sidepanelet – all listetilstand ligger i
 * URL-en, så den tåler en full sidelast og kan limes til noen andre.
 *
 * `undefined` i `patch` fjerner parameteren.
 */
export function listHref(
  params: Record<string, string | undefined>,
  patch: Record<string, string | undefined>,
): string {
  const merged = { ...params, ...patch };
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v) sp.set(k, v);
  }
  const q = sp.toString();
  return q ? `/?${q}` : '/';
}

export function viewCounts(orders: Order[]): Record<ViewKey, number> {
  return {
    bygge: applyView(orders, 'bygge').length,
    fakturere: applyView(orders, 'fakturere').length,
    alle: orders.length,
  };
}
