import { describe, it, expect } from 'vitest';
import { applyView, isViewKey, listHref, viewCounts, viewHref } from '@/lib/views';
import type { Order } from '@/lib/types';

function o(p: Partial<Order>): Order {
  return {
    id: 'x', created_at: '2026-08-01T00:00:00Z', site: 'skjul', product: null,
    config: {}, preferred_date: null, name: 'n', phone: null, email: null,
    address: null, address_meta: {}, price_nok: null, build_status: 'ny',
    invoiced_at: null, paid_at: null, is_test: false,
    planned_build_date: null, internal_notes: null, ...p,
  };
}

describe('views', () => {
  const orders = [
    o({ id: 'a', build_status: 'ny' }),
    o({ id: 'b', build_status: 'under_bygging' }),
    o({ id: 'c', build_status: 'bygd' }),
    o({ id: 'd', build_status: 'montert' }),
    o({ id: 'e', build_status: 'montert', invoiced_at: '2026-08-10T00:00:00Z' }),
  ];

  it('«Å bygge» viser alt som ikke er montert', () => {
    expect(applyView(orders, 'bygge').map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });
  it('«Å fakturere» viser montert uten faktura', () => {
    expect(applyView(orders, 'fakturere').map((x) => x.id)).toEqual(['d']);
  });
  it('«Alle» viser alt', () => {
    expect(applyView(orders, 'alle')).toHaveLength(5);
  });
  it('teller opp hver visning', () => {
    expect(viewCounts(orders)).toEqual({ bygge: 3, fakturere: 1, alle: 5 });
  });
  it('godtar kun kjente visninger', () => {
    expect(isViewKey('bygge')).toBe(true);
    expect(isViewKey('tull')).toBe(false);
    expect(isViewKey(undefined)).toBe(false);
  });
});

describe('viewHref', () => {
  it('utelater view-parameteren for standardvisningen', () => {
    expect(viewHref('bygge', {})).toBe('/');
  });

  it('setter view for de andre visningene', () => {
    expect(viewHref('fakturere', {})).toBe('/?view=fakturere');
    expect(viewHref('alle', {})).toBe('/?view=alle');
  });

  it('tar med aktive filtre, men bytter ut view', () => {
    const href = viewHref('alle', { q: 'kvam', produkt: 'skjul', view: 'fakturere' });
    expect(href.startsWith('/?')).toBe(true);
    const sp = new URLSearchParams(href.slice(2));
    expect(sp.get('q')).toBe('kvam');
    expect(sp.get('produkt')).toBe('skjul');
    expect(sp.get('view')).toBe('alle');
  });

  it('dropper tomme filterverdier', () => {
    expect(viewHref('bygge', { q: '', produkt: undefined })).toBe('/');
  });

  it('beholder ikke valgt ordre når visningen byttes', () => {
    // Den valgte ordren hører til den forrige lista.
    expect(viewHref('alle', { valgt: 'abc' })).toBe('/?view=alle');
  });
});

describe('listHref', () => {
  it('slår sammen med gjeldende parametere', () => {
    const href = listHref({ view: 'fakturere', q: 'kvam' }, { sort: '-pris' });
    const sp = new URLSearchParams(href.slice(2));
    expect(sp.get('view')).toBe('fakturere');
    expect(sp.get('q')).toBe('kvam');
    expect(sp.get('sort')).toBe('-pris');
  });

  it('overskriver eksisterende verdi', () => {
    const href = listHref({ sort: 'alder' }, { sort: '-pris' });
    expect(new URLSearchParams(href.slice(2)).get('sort')).toBe('-pris');
  });

  it('fjerner en parameter når den settes til undefined', () => {
    const href = listHref({ sort: '-pris', valgt: 'abc' }, { valgt: undefined });
    const sp = new URLSearchParams(href.slice(2));
    expect(sp.get('sort')).toBe('-pris');
    expect(sp.has('valgt')).toBe(false);
  });

  it('gir / når ingenting er satt', () => {
    expect(listHref({}, {})).toBe('/');
    expect(listHref({ q: '' }, {})).toBe('/');
  });
});
