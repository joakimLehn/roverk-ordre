import { describe, expect, it } from 'vitest';
import { SORT_COLUMNS, isSortKey, parseSort, sortOrders, toggleSort } from '../src/lib/sort';
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

describe('isSortKey / parseSort', () => {
  it('godtar de definerte kolonnene', () => {
    expect(isSortKey('alder')).toBe(true);
    expect(isSortKey('pris')).toBe(true);
    expect(isSortKey('byggedato')).toBe(true);
    expect(isSortKey('kunde')).toBe(true);
  });

  it('avviser ukjente nøkler', () => {
    expect(isSortKey('drop table')).toBe(false);
    expect(isSortKey(undefined)).toBe(false);
  });

  it('leser retning fra minusprefiks', () => {
    expect(parseSort('pris')).toEqual({ key: 'pris', desc: false });
    expect(parseSort('-pris')).toEqual({ key: 'pris', desc: true });
  });

  // Uten parameter er eldste ordre først – den som har ventet lengst.
  it('faller tilbake til eldste først', () => {
    expect(parseSort(undefined)).toEqual({ key: 'alder', desc: true });
    expect(parseSort('tull')).toEqual({ key: 'alder', desc: true });
  });
});

describe('toggleSort', () => {
  it('snur retningen på kolonnen som alt er aktiv', () => {
    expect(toggleSort('-alder', 'alder')).toBe('alder');
    expect(toggleSort('alder', 'alder')).toBe('-alder');
  });

  it('bytter kolonne med kolonnens egen standardretning', () => {
    // Dyrest og eldst først; nærmeste byggedato og kunde alfabetisk.
    expect(toggleSort('-alder', 'pris')).toBe('-pris');
    expect(toggleSort('-alder', 'byggedato')).toBe('byggedato');
    expect(toggleSort('-alder', 'kunde')).toBe('kunde');
  });
});

describe('sortOrders', () => {
  const NOW = '2026-08-19T10:00:00.000Z';
  const orders = [
    o({ id: 'b', created_at: '2026-08-15T00:00:00Z', price_nok: 30000, name: 'Berg', planned_build_date: '2026-08-25' }),
    o({ id: 'a', created_at: '2026-07-20T00:00:00Z', price_nok: 10000, name: 'Aune', planned_build_date: null }),
    o({ id: 'c', created_at: '2026-08-01T00:00:00Z', price_nok: 50000, name: 'Åsen', planned_build_date: '2026-08-20' }),
  ];

  it('sorterer eldste først som standard', () => {
    expect(sortOrders(orders, '-alder', NOW).map((x) => x.id)).toEqual(['a', 'c', 'b']);
  });

  it('snur til nyeste først', () => {
    expect(sortOrders(orders, 'alder', NOW).map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });

  it('sorterer dyrest først', () => {
    expect(sortOrders(orders, '-pris', NOW).map((x) => x.id)).toEqual(['c', 'b', 'a']);
  });

  // Ordrer uten byggedato skal ligge nederst, ikke først fordi null sorterer lavt.
  it('legger manglende byggedato sist uansett retning', () => {
    expect(sortOrders(orders, 'byggedato', NOW).map((x) => x.id)).toEqual(['c', 'b', 'a']);
    expect(sortOrders(orders, '-byggedato', NOW).map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });

  it('sorterer kundenavn med norsk alfabet', () => {
    // Å skal bak B, ikke foran som i rå kodepunktsammenligning.
    expect(sortOrders(orders, 'kunde', NOW).map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });

  it('behandler manglende pris som 0 og legger den sist ved dyrest først', () => {
    const withNull = [...orders, o({ id: 'null', price_nok: null, created_at: '2026-08-18T00:00:00Z' })];
    expect(sortOrders(withNull, '-pris', NOW)[3].id).toBe('null');
  });

  it('endrer ikke lista som sendes inn', () => {
    const input = [...orders];
    sortOrders(input, '-pris', NOW);
    expect(input.map((x) => x.id)).toEqual(['b', 'a', 'c']);
  });

  it('har en norsk overskrift for hver kolonne', () => {
    for (const c of SORT_COLUMNS) {
      expect(c.label).toMatch(/\S/);
      expect(isSortKey(c.key)).toBe(true);
    }
  });
});
