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

export function viewCounts(orders: Order[]): Record<ViewKey, number> {
  return {
    bygge: applyView(orders, 'bygge').length,
    fakturere: applyView(orders, 'fakturere').length,
    alle: orders.length,
  };
}
