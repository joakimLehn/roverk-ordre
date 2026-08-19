import type { Order } from './types';

/**
 * Fakturert og Betalt er to uavhengige tidsstempler i basen, men i praksis går
 * en ordre alltid samme vei: ikke fakturert → fakturert → betalt. Ordrelista
 * viser derfor de to kolonnene som ett trinn, mens ordredetaljene beholder dem
 * som uavhengige avhukinger slik at enhver kombinasjon er tilgjengelig.
 *
 * Datamodellen røres ikke – dette er kun en lesning av den.
 */
export type MoneyState = 0 | 1 | 2;

export const MONEY_LABELS: Record<MoneyState, string> = {
  0: 'Ikke fakturert',
  1: 'Fakturert',
  2: 'Betalt',
};

type MoneyFields = Pick<Order, 'invoiced_at' | 'paid_at'>;

export function moneyState(o: MoneyFields): MoneyState {
  if (o.paid_at) return 2;
  if (o.invoiced_at) return 1;
  return 0;
}

/** Hvilket felt som endres når brikken trykkes videre. */
export interface MoneyStep {
  field: 'invoiced' | 'paid';
  next: boolean;
}

/**
 * Steget videre fra et trinn, eller `null` på siste trinn. Betalt er
 * bevisst terminalt: å trykke videre derfra måtte nullstilt tidsstempler i
 * stillhet, og det er nettopp den typen usynlige endringer som ikke skal
 * kunne skje med hansker på.
 */
export function advanceMoney(s: MoneyState): MoneyStep | null {
  if (s === 0) return { field: 'invoiced', next: true };
  if (s === 1) return { field: 'paid', next: true };
  return null;
}

export function stateAfter(s: MoneyState): MoneyState {
  if (s === 0) return 1;
  return 2;
}

export function undoOf(step: MoneyStep): MoneyStep {
  return { field: step.field, next: !step.next };
}
