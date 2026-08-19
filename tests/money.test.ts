import { describe, expect, it } from 'vitest';
import {
  MONEY_LABELS,
  advanceMoney,
  moneyState,
  stateAfter,
  undoOf,
  type MoneyState,
} from '../src/lib/money';

const T = '2026-08-19T10:00:00.000Z';

describe('moneyState', () => {
  it('er ikke fakturert når ingen tidsstempler finnes', () => {
    expect(moneyState({ invoiced_at: null, paid_at: null })).toBe(0);
  });

  it('er fakturert når bare invoiced_at finnes', () => {
    expect(moneyState({ invoiced_at: T, paid_at: null })).toBe(1);
  });

  it('er betalt når begge finnes', () => {
    expect(moneyState({ invoiced_at: T, paid_at: T })).toBe(2);
  });

  // Kombinasjonen er ikke reell, men den er tilgjengelig fra ordredetaljene
  // fordi de to dimensjonene er uavhengige i datamodellen. Betalt veier tyngst.
  it('er betalt når paid_at finnes uten invoiced_at', () => {
    expect(moneyState({ invoiced_at: null, paid_at: T })).toBe(2);
  });
});

describe('advanceMoney', () => {
  it('fakturerer fra første trinn', () => {
    expect(advanceMoney(0)).toEqual({ field: 'invoiced', next: true });
  });

  it('markerer betalt fra andre trinn', () => {
    expect(advanceMoney(1)).toEqual({ field: 'paid', next: true });
  });

  // Å gå videre fra Betalt ville måtte nullstille tidsstempler i stillhet.
  // Reversering skjer via angre eller ordredetaljene, ikke ved å trykke rundt.
  it('har ingen neste steg fra betalt', () => {
    expect(advanceMoney(2)).toBeNull();
  });
});

describe('stateAfter', () => {
  it('flytter ett trinn opp og stopper på betalt', () => {
    expect(stateAfter(0)).toBe(1);
    expect(stateAfter(1)).toBe(2);
    expect(stateAfter(2)).toBe(2);
  });
});

describe('undoOf', () => {
  it('snur steget', () => {
    expect(undoOf({ field: 'invoiced', next: true })).toEqual({ field: 'invoiced', next: false });
    expect(undoOf({ field: 'paid', next: true })).toEqual({ field: 'paid', next: false });
  });
});

describe('MONEY_LABELS', () => {
  it('har norsk etikett for hvert trinn', () => {
    const states: MoneyState[] = [0, 1, 2];
    for (const s of states) {
      expect(MONEY_LABELS[s]).toMatch(/\S/);
    }
    expect(MONEY_LABELS[0]).toBe('Ikke fakturert');
    expect(MONEY_LABELS[1]).toBe('Fakturert');
    expect(MONEY_LABELS[2]).toBe('Betalt');
  });
});
