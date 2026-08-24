import { describe, it, expect } from 'vitest';
import { parseInspection } from '@/lib/inspection';

describe('parseInspection', () => {
  it('godtar bare navn og setter resten til null', () => {
    const r = parseInspection({ name: ' Kari Nordmann ' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data).toEqual({
      name: 'Kari Nordmann',
      phone: null,
      email: null,
      address: null,
      scheduled_on: null,
      scheduled_time: null,
      product: null,
      channel: null,
      notes: null,
    });
  });

  it('avviser klokkeslett uten dato med norsk melding', () => {
    const r = parseInspection({ name: 'Kari', scheduled_time: '10:00' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatch(/dato/i);
    expect(r.error).toMatch(/klokkeslett|tid/i);
  });

  it('avviser ugyldig e-post med norsk melding', () => {
    const r = parseInspection({ name: 'Kari', email: 'ikke-en-epost' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatch(/e-post/i);
  });

  it('normaliserer e-post og godtar dato+klokkeslett sammen', () => {
    const r = parseInspection({
      name: 'Kari',
      email: ' Kari@Epost.NO ',
      scheduled_on: '2026-08-24',
      scheduled_time: '14:30',
      product: 'skjul',
      kanal: 'Telefon',
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.email).toBe('kari@epost.no');
    expect(r.data.scheduled_on).toBe('2026-08-24');
    expect(r.data.scheduled_time).toBe('14:30');
    expect(r.data.product).toBe('skjul');
    expect(r.data.channel).toBe('Telefon');
  });

  it('avviser ukjent produkt og kanal, uten å gjette annet', () => {
    expect(parseInspection({ name: 'Kari', product: 'terrasse' }).ok).toBe(false);
    expect(parseInspection({ name: 'Kari', kanal: 'Brevdue' }).ok).toBe(false);
  });

  it('avviser tomt navn', () => {
    const r = parseInspection({ name: '  ' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatch(/navn/i);
  });
});
