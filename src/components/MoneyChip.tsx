'use client';

// Én brikke for pengetilstanden, brukt både i mobilkortet og i tabellraden.
//
// Erstatter to ~115 px brede nabobrikker som gjorde nesten det samme. To
// avhukinger side om side inviterer til nabotreff, og «betalt uten fakturert»
// er ikke en tilstand noen mente å lage.

import { setInvoiced, setPaid } from '@/app/ordre/[id]/actions';
import { MONEY_LABELS, advanceMoney, stateAfter, undoOf, type MoneyState } from '@/lib/money';
import { useOptimisticField } from './useOptimisticField';

const STYLES: Record<MoneyState, string> = {
  0: 'border-line bg-white text-muted',
  1: 'border-ok/35 bg-ok-bg text-ok',
  2: 'border-ok bg-ok text-white',
};

const PAST_TENSE: Record<'invoiced' | 'paid', [string, string]> = {
  invoiced: ['fakturert', 'ikke fakturert'],
  paid: ['betalt', 'ikke betalt'],
};

export function MoneyChip({
  orderId,
  kunde,
  invoiced,
  paid,
  className = '',
}: {
  orderId: string;
  kunde: string;
  invoiced: boolean;
  paid: boolean;
  className?: string;
}) {
  const server: MoneyState = paid ? 2 : invoiced ? 1 : 0;
  const money = useOptimisticField(server);
  const step = advanceMoney(money.value);

  function write(field: 'invoiced' | 'paid', next: boolean) {
    return field === 'invoiced' ? setInvoiced(orderId, next) : setPaid(orderId, next);
  }

  const label = MONEY_LABELS[money.value];

  // Siste trinn er ikke en knapp – det finnes ikke noe neste trinn å trykke
  // seg til, og reversering hører hjemme på ordredetaljene.
  if (!step) {
    return (
      <span
        className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[12.5px] font-bold ${STYLES[money.value]} ${className}`}
      >
        <span aria-hidden="true">✓</span> {label}
      </span>
    );
  }

  const undo = undoOf(step);
  const [done] = PAST_TENSE[step.field];

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        money.run(stateAfter(money.value), {
          action: () => write(step.field, step.next),
          message: `${kunde} · ${done}`,
          undo: () => write(undo.field, undo.next),
        });
      }}
      /* Ett tilgjengelighetsnavn, ikke tre kilder som slåss: den synlige
         teksten sier tilstanden, aria-label sier tilstand + handling. */
      aria-label={`${label} – marker som ${done}`}
      title={`Marker som ${done}`}
      className={`focus-ring flex min-h-[38px] cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[12.5px] font-bold ${STYLES[money.value]} ${className}`}
    >
      {money.value === 0 ? null : <span aria-hidden="true">✓</span>}
      {label}
    </button>
  );
}
