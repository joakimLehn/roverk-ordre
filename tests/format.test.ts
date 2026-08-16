import { describe, it, expect } from 'vitest';
import { formatPrice, siteLabel, configEntries, formatDateNo, materialLabel } from '@/lib/format';

describe('format', () => {
  it('formatterer pris med tusenskille og kr', () => {
    expect(formatPrice(64900)).toBe('64 900 kr');
    expect(formatPrice(null)).toBe('–');
  });
  it('mapper site til produktnavn', () => {
    expect(siteLabel('skjul')).toBe('Skjul');
    expect(siteLabel('ved')).toBe('Ved');
    expect(siteLabel('orden')).toBe('Orden');
    expect(siteLabel('orden-v2')).toBe('Orden');
    expect(siteLabel('ukjent')).toBe('ukjent');
  });
  it('gjør config-jsonb om til lesbare rader og hopper over tomme/objekter', () => {
    const rows = configEntries({ bredde_mm: 3100, tak: 'torvtak', nested: { a: 1 }, tom: null });
    expect(rows).toContainEqual({ key: 'bredde_mm', value: '3100' });
    expect(rows).toContainEqual({ key: 'tak', value: 'torvtak' });
    expect(rows.find((r) => r.key === 'nested')).toBeUndefined();
    expect(rows.find((r) => r.key === 'tom')).toBeUndefined();
  });
  it('oversetter kjente config-nøkler og -verdier til norsk', () => {
    const rows = configEntries({ kledning: 'ubeh', serie: 'Standard', montering: true, count: 4 });
    expect(rows).toContainEqual({ key: 'Kledning', value: 'Impregnert' });
    expect(rows).toContainEqual({ key: 'Serie', value: 'Standard' });
    expect(rows).toContainEqual({ key: 'Montering', value: 'Ja' });
    expect(rows).toContainEqual({ key: 'Antall dunker', value: '4' });
  });
  it('materialLabel: royal/ubeh -> Royal/Impregnert, ellers null', () => {
    expect(materialLabel({ kledning: 'royal' })).toBe('Royal');
    expect(materialLabel({ kledning: 'ubeh' })).toBe('Impregnert');
    expect(materialLabel({})).toBeNull();
  });
  it('formatterer ISO-dato som norsk kortdato', () => {
    expect(formatDateNo('2026-08-14')).toBe('14. aug. 2026');
    expect(formatDateNo(null)).toBe('–');
    expect(formatDateNo('tull')).toBe('–');
  });
});
