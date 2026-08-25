import { describe, it, expect } from 'vitest';
import {
  normalizeInspection,
  normalizeOrder,
  toDateString,
  toIsoString,
  toTimeString,
} from '@/lib/normalize';

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
  it('kutter Postgres-time til HH:MM', () => {
    expect(toTimeString('14:00:00')).toBe('14:00');
    expect(toTimeString('09:05:12.123')).toBe('09:05');
    expect(toTimeString(new Date(2026, 7, 25, 14, 30, 45))).toBe('14:30');
    expect(toTimeString(null)).toBeNull();
  });
  it('ugyldig time-verdi blir null, ikke Date eller råstreng', () => {
    expect(toTimeString('ikke-klokke')).toBeNull();
    expect(toTimeString('')).toBeNull();
    expect(toTimeString(undefined)).toBeNull();
  });
  it('normaliserer en hel befaringsrad uten Date-objekter', () => {
    const i = normalizeInspection({
      id: 'i1',
      created_at: new Date('2026-08-24T10:00:00.000Z'),
      updated_at: new Date('2026-08-24T11:00:00.000Z'),
      created_by: 'a@roverk.no',
      name: 'Kari',
      phone: '90000000',
      email: 'kari@x.no',
      address: 'Gate 1',
      scheduled_on: new Date(2026, 7, 25),
      scheduled_time: '14:00:00',
      status: 'aktiv',
      product: 'skjul',
      channel: 'Telefon',
      notes: null,
      file_count: '2',
    });
    expect(i.created_at).toBe('2026-08-24T10:00:00.000Z');
    expect(i.updated_at).toBe('2026-08-24T11:00:00.000Z');
    expect(i.scheduled_on).toBe('2026-08-25');
    expect(i.scheduled_time).toBe('14:00');
    expect(i.file_count).toBe(2);
    for (const v of Object.values(i)) {
      expect(v instanceof Date).toBe(false);
    }
  });
  it('ugyldig klokke og manglende file_count gir null og 0', () => {
    const i = normalizeInspection({
      id: 'i1',
      created_at: new Date('2026-08-24T10:00:00.000Z'),
      updated_at: new Date('2026-08-24T11:00:00.000Z'),
      name: 'Kari',
      scheduled_on: null,
      scheduled_time: 'ikke-klokke',
      status: 'aktiv',
      product: null,
    });
    expect(i.scheduled_time).toBeNull();
    expect(i.file_count).toBe(0);
    expect(typeof i.created_at).toBe('string');
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
