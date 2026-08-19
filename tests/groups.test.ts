import { describe, expect, it } from 'vitest';
import { BUILD_GROUP_LABELS, buildGroupOf, groupByBuildDate, osloDate } from '../src/lib/groups';
import type { Order } from '../src/lib/types';

function o(p: Partial<Order>): Order {
  return {
    id: 'x', created_at: '2026-08-01T00:00:00Z', site: 'skjul', product: null,
    config: {}, preferred_date: null, name: 'n', phone: null, email: null,
    address: null, address_meta: {}, price_nok: null, build_status: 'ny',
    invoiced_at: null, paid_at: null, is_test: false,
    planned_build_date: null, internal_notes: null, ...p,
  };
}

// Onsdag 19. august 2026.
const TODAY = '2026-08-19';

describe('osloDate', () => {
  it('gir norsk dato, ikke UTC-dato, sent på kvelden', () => {
    // 22:30 UTC er 00:30 neste dag i Oslo om sommeren.
    expect(osloDate('2026-08-19T22:30:00.000Z')).toBe('2026-08-20');
  });

  it('gir samme dag midt på dagen', () => {
    expect(osloDate('2026-08-19T10:00:00.000Z')).toBe('2026-08-19');
  });

  it('håndterer vintertid', () => {
    // Januar: Oslo er UTC+1, så 23:30 UTC er 00:30 neste dag.
    expect(osloDate('2026-01-15T23:30:00.000Z')).toBe('2026-01-16');
    expect(osloDate('2026-01-15T22:30:00.000Z')).toBe('2026-01-15');
  });
});

describe('buildGroupOf', () => {
  it('setter ordrer uten byggedato i egen gruppe', () => {
    expect(buildGroupOf(null, TODAY)).toBe('ingen');
  });

  it('flagger byggedato som har passert som forfalt', () => {
    expect(buildGroupOf('2026-08-18', TODAY)).toBe('forfalt');
    expect(buildGroupOf('2026-07-01', TODAY)).toBe('forfalt');
  });

  it('kjenner i dag', () => {
    expect(buildGroupOf(TODAY, TODAY)).toBe('i_dag');
  });

  // Uka regnes mandag–søndag. 19. august 2026 er en onsdag, så uka slutter
  // søndag 23. august.
  it('tar resten av uka ut mot søndag', () => {
    expect(buildGroupOf('2026-08-20', TODAY)).toBe('uka');
    expect(buildGroupOf('2026-08-23', TODAY)).toBe('uka');
    expect(buildGroupOf('2026-08-24', TODAY)).toBe('senere');
  });

  it('legger alt etter denne uka i senere', () => {
    expect(buildGroupOf('2026-09-10', TODAY)).toBe('senere');
  });

  it('håndterer at i dag er en søndag', () => {
    const sunday = '2026-08-23';
    expect(buildGroupOf(sunday, sunday)).toBe('i_dag');
    // Ingen dager igjen av uka – mandagen etter er «senere».
    expect(buildGroupOf('2026-08-24', sunday)).toBe('senere');
  });

  it('håndterer at i dag er en mandag', () => {
    const monday = '2026-08-17';
    expect(buildGroupOf('2026-08-23', monday)).toBe('uka');
    expect(buildGroupOf('2026-08-24', monday)).toBe('senere');
  });
});

describe('groupByBuildDate', () => {
  const orders = [
    o({ id: 'senere', planned_build_date: '2026-09-01' }),
    o({ id: 'ingen-ny', planned_build_date: null, created_at: '2026-08-10T00:00:00Z' }),
    o({ id: 'i-dag-b', planned_build_date: TODAY, created_at: '2026-08-05T00:00:00Z' }),
    o({ id: 'forfalt', planned_build_date: '2026-08-12' }),
    o({ id: 'i-dag-a', planned_build_date: TODAY, created_at: '2026-08-02T00:00:00Z' }),
    o({ id: 'ingen-gammel', planned_build_date: null, created_at: '2026-07-01T00:00:00Z' }),
    o({ id: 'uka', planned_build_date: '2026-08-21' }),
  ];

  it('sorterer gruppene i hastverksrekkefølge', () => {
    expect(groupByBuildDate(orders, TODAY).map((g) => g.key)).toEqual([
      'forfalt', 'i_dag', 'uka', 'senere', 'ingen',
    ]);
  });

  it('utelater tomme grupper', () => {
    const only = [o({ id: 'a', planned_build_date: null })];
    expect(groupByBuildDate(only, TODAY).map((g) => g.key)).toEqual(['ingen']);
  });

  it('sorterer eldste ordre først innenfor samme dag', () => {
    const iDag = groupByBuildDate(orders, TODAY).find((g) => g.key === 'i_dag');
    expect(iDag?.orders.map((x) => x.id)).toEqual(['i-dag-a', 'i-dag-b']);
  });

  it('sorterer gruppa uten byggedato eldste først', () => {
    const ingen = groupByBuildDate(orders, TODAY).find((g) => g.key === 'ingen');
    expect(ingen?.orders.map((x) => x.id)).toEqual(['ingen-gammel', 'ingen-ny']);
  });

  it('gir hver gruppe en norsk etikett og riktig antall', () => {
    for (const g of groupByBuildDate(orders, TODAY)) {
      expect(g.label).toBe(BUILD_GROUP_LABELS[g.key]);
      expect(g.orders.length).toBeGreaterThan(0);
    }
  });

  it('mister ingen ordrer', () => {
    const total = groupByBuildDate(orders, TODAY).reduce((n, g) => n + g.orders.length, 0);
    expect(total).toBe(orders.length);
  });
});
