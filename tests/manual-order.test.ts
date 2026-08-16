import { describe, it, expect } from 'vitest';
import { parseManualOrder } from '@/lib/manual-order';

describe('parseManualOrder', () => {
  it('godtar minimal ordre: produkt + navn', () => {
    const r = parseManualOrder({ site: 'ved', name: 'Per Hansen', kanal: 'Instagram' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.site).toBe('ved');
      expect(r.data.kanal).toBe('Instagram');
      expect(r.data.phone).toBeNull();
      expect(r.data.email).toBeNull();
      expect(r.data.price_nok).toBeNull();
    }
  });
  it('krever produkt og navn', () => {
    expect(parseManualOrder({ site: '', name: 'Per' }).ok).toBe(false);
    expect(parseManualOrder({ site: 'tull', name: 'Per' }).ok).toBe(false);
    expect(parseManualOrder({ site: 'skjul', name: '  ' }).ok).toBe(false);
  });
  it('validerer e-post når den er oppgitt', () => {
    expect(parseManualOrder({ site: 'skjul', name: 'Per', email: 'tull' }).ok).toBe(false);
    const r = parseManualOrder({ site: 'skjul', name: 'Per', email: ' Per@Epost.NO ' });
    expect(r.ok && r.data.email).toBe('per@epost.no');
  });
  it('tolker pris med mellomrom og avviser negativ', () => {
    const r = parseManualOrder({ site: 'skjul', name: 'Per', price_nok: '64 900' });
    expect(r.ok && r.data.price_nok).toBe(64900);
    expect(parseManualOrder({ site: 'skjul', name: 'Per', price_nok: '-5' }).ok).toBe(false);
    expect(parseManualOrder({ site: 'skjul', name: 'Per', price_nok: 'abc' }).ok).toBe(false);
  });
  it('ukjent kanal blir Annet, ugyldig dato blir null', () => {
    const r = parseManualOrder({ site: 'orden', name: 'Per', kanal: 'Brevdue', preferred_date: 'snart' });
    expect(r.ok && r.data.kanal).toBe('Annet');
    expect(r.ok && r.data.preferred_date).toBeNull();
  });
});
