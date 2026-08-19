import { describe, expect, it } from 'vitest';
import { STALE_AFTER_DAYS, ageInDays, isStale } from '../src/lib/age';
import type { BuildStatus } from '../src/lib/types';

const NOW = '2026-08-19T10:00:00.000Z';

describe('ageInDays', () => {
  it('er 0 samme dag', () => {
    expect(ageInDays('2026-08-19T08:00:00.000Z', NOW)).toBe(0);
  });

  it('teller hele døgn', () => {
    expect(ageInDays('2026-08-18T10:00:00.000Z', NOW)).toBe(1);
    expect(ageInDays('2026-07-27T10:00:00.000Z', NOW)).toBe(23);
  });

  it('runder ned på påbegynte døgn', () => {
    expect(ageInDays('2026-08-17T23:00:00.000Z', NOW)).toBe(1);
  });

  // Nettsiden er avsender; en ordre med tidsstempel litt fram i tid skal ikke
  // gi negativ alder i lista.
  it('gir 0 for tidsstempler fram i tid', () => {
    expect(ageInDays('2026-08-20T10:00:00.000Z', NOW)).toBe(0);
  });

  it('gir 0 for ugyldige og manglende datoer', () => {
    expect(ageInDays(null, NOW)).toBe(0);
    expect(ageInDays('ikke en dato', NOW)).toBe(0);
  });
});

describe('isStale', () => {
  it('flagger en Ny som har stått over terskelen', () => {
    expect(isStale('ny', 15)).toBe(true);
    expect(isStale('ny', 14)).toBe(false);
    expect(isStale('ny', 2)).toBe(false);
  });

  it('bruker egen terskel per byggstatus', () => {
    expect(isStale('under_bygging', 15)).toBe(false);
    expect(isStale('under_bygging', 31)).toBe(true);
    expect(isStale('bygd', 22)).toBe(true);
  });

  // Montert er ferdig bygget – da er alder siden mottak ikke lenger signalet.
  it('flagger aldri montert', () => {
    expect(isStale('montert', 400)).toBe(false);
  });

  it('har en terskel definert for hver byggstatus', () => {
    const all: BuildStatus[] = ['ny', 'under_bygging', 'bygd', 'montert'];
    for (const s of all) {
      expect(s in STALE_AFTER_DAYS).toBe(true);
    }
  });
});
