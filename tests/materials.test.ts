import { describe, it, expect } from 'vitest';
import { materialsFor } from '@/data/materials';

describe('materialsFor', () => {
  it('finner liste for 4-dunk Standard', () => {
    const m = materialsFor('skjul', { serie: 'Standard', count: 4, kledning: 'royal' });
    expect(m).not.toBeNull();
    expect(m!.items.length).toBeGreaterThan(5);
    expect(m!.source.toLowerCase()).toContain('plukkliste');
    expect(m!.perUnit).toBe(true);
  });
  it('kledning styrer materialkvaliteten: impregnert har ingen Royal-varer', () => {
    const impregnert = materialsFor('skjul', { serie: 'Standard', count: 4, kledning: 'ubeh' })!;
    const alt = JSON.stringify(impregnert.items);
    expect(alt).not.toContain('Royal');
    expect(impregnert.source).toContain('impregnert');

    const royal = materialsFor('skjul', { serie: 'Standard', count: 4, kledning: 'royal' })!;
    expect(royal.items[0].dimensjon).toContain('Royal');
    expect(royal.source).toContain('Royal');
  });
  it('skjul XL, andre antall dunker og manglende config får ingen liste', () => {
    expect(materialsFor('skjul', { serie: 'XL', count: 3 })).toBeNull();
    expect(materialsFor('skjul', { serie: 'Standard', count: 3 })).toBeNull();
    expect(materialsFor('skjul', {})).toBeNull();
  });
  it('finner Ved-liste når config avslører modell', () => {
    const stor = materialsFor('ved', { modell: 'Stor' });
    expect(stor).not.toBeNull();
    expect(stor!.source).toContain('Stor');
    const medium = materialsFor('ved', { variant: 'medium 2-etasjes' });
    expect(medium).not.toBeNull();
    expect(medium!.source).toContain('Medium');
  });
  it('returnerer null når varianten ikke kan avgjøres (aldri feil liste)', () => {
    expect(materialsFor('ved', {})).toBeNull();
    expect(materialsFor('orden', {})).toBeNull();
    expect(materialsFor('ukjent-produkt', {})).toBeNull();
  });
});
