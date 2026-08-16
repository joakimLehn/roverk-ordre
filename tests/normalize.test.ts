import { describe, it, expect } from 'vitest';
import { normalizeOrder, toDateString, toIsoString } from '@/lib/normalize';

describe('normalize', () => {
  it('gjør Date om til ISO-streng for tidsstempler', () => {
    expect(toIsoString(new Date('2026-07-16T18:33:43.959Z'))).toBe('2026-07-16T18:33:43.959Z');
    expect(toIsoString('2026-07-16T18:33:43.959Z')).toBe('2026-07-16T18:33:43.959Z');
    expect(toIsoString(null)).toBeNull();
  });
  it('gjør Date om til YYYY-MM-DD uten tidssoneforskyvning', () => {
    // Date ved lokal midnatt (slik pg-drivere parser date-kolonner)
    expect(toDateString(new Date(2026, 7, 22))).toBe('2026-08-22');
    expect(toDateString('2026-08-22')).toBe('2026-08-22');
    expect(toDateString('2026-08-22T00:00:00.000Z')).toBe('2026-08-22');
    expect(toDateString(null)).toBeNull();
  });
  it('normaliserer en hel ordre-rad', () => {
    const o = normalizeOrder({
      id: 'x',
      created_at: new Date('2026-07-16T18:33:43.959Z'),
      preferred_date: new Date(2026, 7, 22),
      planned_build_date: null,
      invoiced_at: new Date('2026-08-10T00:00:00.000Z'),
      paid_at: null,
      name: 'Kari',
    });
    expect(o.created_at).toBe('2026-07-16T18:33:43.959Z');
    expect(o.preferred_date).toBe('2026-08-22');
    expect(o.planned_build_date).toBeNull();
    expect(o.invoiced_at).toBe('2026-08-10T00:00:00.000Z');
    expect(o.paid_at).toBeNull();
    expect(o.name).toBe('Kari');
  });
});
