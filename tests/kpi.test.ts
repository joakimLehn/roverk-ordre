import { describe, it, expect } from 'vitest';
import { computeKpis } from '@/lib/kpi';
import type { Order } from '@/lib/types';

function o(p: Partial<Order>): Order {
  return {
    id: 'x', created_at: '2026-08-01T00:00:00Z', site: 'skjul', product: null,
    config: {}, preferred_date: null, name: 'n', phone: 'p', email: 'e',
    address: null, address_meta: {}, price_nok: null, build_status: 'ny',
    invoiced_at: null, paid_at: null, is_test: false,
    planned_build_date: null, internal_notes: null, ...p,
  };
}

describe('computeKpis', () => {
  it('teller nye, under bygging og montert-ikke-fakturert', () => {
    const k = computeKpis([
      o({ build_status: 'ny' }),
      o({ build_status: 'under_bygging' }),
      o({ build_status: 'montert' }),
      o({ build_status: 'montert', invoiced_at: '2026-08-10T00:00:00Z' }),
    ]);
    expect(k.nye).toBe(1);
    expect(k.underBygging).toBe(1);
    expect(k.montertIkkeFakturert).toBe(1);
  });
  it('utestående = fakturert men ikke betalt, summert i kr', () => {
    const k = computeKpis([
      o({ invoiced_at: '2026-08-10T00:00:00Z', price_nok: 50000 }),
      o({ invoiced_at: '2026-08-10T00:00:00Z', paid_at: '2026-08-12T00:00:00Z', price_nok: 99999 }),
      o({ invoiced_at: '2026-08-11T00:00:00Z', price_nok: 36400 }),
    ]);
    expect(k.utestaaendeNok).toBe(86400);
  });
  it('summerer totalt ordrebeløp for alle reelle ordrer', () => {
    const k = computeKpis([
      o({ price_nok: 64900 }),
      o({ price_nok: 18400, paid_at: '2026-08-12T00:00:00Z' }),
      o({ price_nok: null }),
      o({ price_nok: 99999, is_test: true }),
    ]);
    expect(k.totalNok).toBe(83300);
  });
  it('ignorerer testordrer fullstendig', () => {
    const k = computeKpis([
      o({ is_test: true, build_status: 'ny', invoiced_at: '2026-08-10T00:00:00Z', price_nok: 1000 }),
    ]);
    expect(k).toEqual({ nye: 0, underBygging: 0, montertIkkeFakturert: 0, utestaaendeNok: 0, totalNok: 0 });
  });
});
