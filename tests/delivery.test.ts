import { describe, expect, it } from 'vitest';
import { parseDelivery } from '@/lib/delivery';

describe('parseDelivery', () => {
  it('godtar dato med klokke, og kutter sekunder', () => {
    expect(parseDelivery('2026-10-14', '10:00')).toEqual({
      ok: true,
      delivery_date: '2026-10-14',
      delivery_time: '10:00',
    });

    const kuttet = parseDelivery('2026-10-14', '10:30:00');
    expect(kuttet.ok && kuttet.delivery_time).toBe('10:30');
  });

  it('godtar dato uten klokke', () => {
    expect(parseDelivery('2026-10-14', '')).toEqual({
      ok: true,
      delivery_date: '2026-10-14',
      delivery_time: null,
    });
  });

  it('tom dato og klokke tømmer begge', () => {
    expect(parseDelivery('', '')).toEqual({ ok: true, delivery_date: null, delivery_time: null });
    expect(parseDelivery('  ', ' ')).toEqual({ ok: true, delivery_date: null, delivery_time: null });
  });

  it('avviser klokke uten dato', () => {
    expect(parseDelivery('', '10:00')).toEqual({
      ok: false,
      error: 'Klokkeslett krever leveringsdato.',
    });
  });

  it('avviser ugyldig dato og klokke', () => {
    expect(parseDelivery('14.10.2026', '')).toEqual({ ok: false, error: 'Ugyldig dato.' });
    expect(parseDelivery('2026-10-14', '25:00')).toEqual({ ok: false, error: 'Ugyldig klokkeslett.' });
    expect(parseDelivery('2026-10-14', 'ti')).toEqual({ ok: false, error: 'Ugyldig klokkeslett.' });
  });
});
