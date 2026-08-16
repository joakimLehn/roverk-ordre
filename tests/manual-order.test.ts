import { describe, it, expect } from 'vitest';
import { parseManualOrder } from '@/lib/manual-order';

describe('parseManualOrder', () => {
  it('skjul: bygger config som nettsiden og genererer produkttekst', () => {
    const r = parseManualOrder({
      site: 'skjul', name: 'Per Hansen', kanal: 'Instagram',
      skjul_count: '4', skjul_serie: 'Standard', skjul_kledning: 'royal',
      skjul_montering: 'on',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.config).toEqual({
        count: 4, serie: 'Standard', kledning: 'royal', montering: true, forankring: false,
      });
      expect(r.data.product).toBe('4-dunk Standard');
      expect(r.data.kanal).toBe('Instagram');
      expect(r.data.phone).toBeNull();
    }
  });
  it('ved: modell gir size + produkttekst (materialoppslag virker)', () => {
    const r = parseManualOrder({ site: 'ved', name: 'Kari', ved_modell: 'Stor' });
    expect(r.ok && r.data.config).toEqual({ navn: 'Stor', size: 'stor' });
    expect(r.ok && r.data.product).toBe('Vedskjul Stor');
  });
  it('orden: kassetype + mål, avviser ugyldige mål', () => {
    const r = parseManualOrder({ site: 'orden', name: 'Nils', orden_bt: '100L', orden_w: '3', orden_h: '5', orden_hjul: 'on' });
    expect(r.ok && r.data.config).toEqual({ bt: '100L', w: 3, h: 5, withWheels: true });
    expect(r.ok && r.data.product).toBe('Orden 100L · 3×5');
    expect(parseManualOrder({ site: 'orden', name: 'Nils', orden_w: '9', orden_h: '5' }).ok).toBe(false);
  });
  it('skjul: avviser ugyldig antall dunker', () => {
    expect(parseManualOrder({ site: 'skjul', name: 'Per', skjul_count: '0' }).ok).toBe(false);
    expect(parseManualOrder({ site: 'skjul', name: 'Per', skjul_count: 'mange' }).ok).toBe(false);
  });
  it('krever produkt og navn', () => {
    expect(parseManualOrder({ site: '', name: 'Per' }).ok).toBe(false);
    expect(parseManualOrder({ site: 'tull', name: 'Per' }).ok).toBe(false);
    expect(parseManualOrder({ site: 'skjul', name: '  ', skjul_count: '4' }).ok).toBe(false);
  });
  it('validerer e-post når den er oppgitt', () => {
    expect(parseManualOrder({ site: 'ved', name: 'Per', email: 'tull' }).ok).toBe(false);
    const r = parseManualOrder({ site: 'ved', name: 'Per', email: ' Per@Epost.NO ' });
    expect(r.ok && r.data.email).toBe('per@epost.no');
  });
  it('tolker pris med mellomrom og avviser negativ', () => {
    const r = parseManualOrder({ site: 'ved', name: 'Per', price_nok: '64 900' });
    expect(r.ok && r.data.price_nok).toBe(64900);
    expect(parseManualOrder({ site: 'ved', name: 'Per', price_nok: '-5' }).ok).toBe(false);
  });
  it('ukjent kanal blir Annet, ugyldig dato blir null, egen produkttekst vinner', () => {
    const r = parseManualOrder({
      site: 'ved', name: 'Per', kanal: 'Brevdue', preferred_date: 'snart', product: 'Spesial dobbel',
    });
    expect(r.ok && r.data.kanal).toBe('Annet');
    expect(r.ok && r.data.preferred_date).toBeNull();
    expect(r.ok && r.data.product).toBe('Spesial dobbel');
  });
});
