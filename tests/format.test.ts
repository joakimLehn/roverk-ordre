import { describe, it, expect } from 'vitest';
import { formatPrice, siteLabel, configEntries, formatDateNo } from '@/lib/format';

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
  it('formatterer ISO-dato som norsk kortdato', () => {
    expect(formatDateNo('2026-08-14')).toBe('14. aug. 2026');
    expect(formatDateNo(null)).toBe('–');
    expect(formatDateNo('tull')).toBe('–');
  });
});
