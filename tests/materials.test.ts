import { describe, it, expect } from 'vitest';
import { materialsFor } from '@/data/materials';

describe('materialsFor', () => {
  it('finner liste for skjul', () => {
    const m = materialsFor('skjul', {});
    expect(m).not.toBeNull();
    expect(m!.items.length).toBeGreaterThan(5);
    expect(m!.source.toLowerCase()).toContain('plukkliste');
    expect(m!.perUnit).toBe(true);
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
