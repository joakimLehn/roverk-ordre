import type { Order } from './types';

export interface Kpis {
  nye: number;
  underBygging: number;
  montertIkkeFakturert: number;
  utestaaendeNok: number;
  totalNok: number;
}

export function computeKpis(orders: Order[]): Kpis {
  const reelle = orders.filter((o) => !o.is_test);
  return {
    nye: reelle.filter((o) => o.build_status === 'ny').length,
    underBygging: reelle.filter((o) => o.build_status === 'under_bygging').length,
    montertIkkeFakturert: reelle.filter((o) => o.build_status === 'montert' && !o.invoiced_at).length,
    utestaaendeNok: reelle
      .filter((o) => o.invoiced_at && !o.paid_at)
      .reduce((sum, o) => sum + (o.price_nok ?? 0), 0),
    totalNok: reelle.reduce((sum, o) => sum + (o.price_nok ?? 0), 0),
  };
}
