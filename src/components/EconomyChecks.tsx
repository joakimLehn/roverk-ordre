'use client';

import { setInvoiced, setPaid, setTestFlag } from '@/app/ordre/[id]/actions';
import { useOptimisticField } from './useOptimisticField';

function Box({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border-[1.5px] text-[11px] text-white ${
        on ? 'border-ok bg-ok' : 'border-muted'
      }`}
    >
      {on ? '✓' : ''}
    </span>
  );
}

function Toggle({
  on,
  label,
  onToggle,
}: {
  on: boolean;
  label: string;
  onToggle: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onToggle(!on)}
      className={`focus-ring flex min-h-[52px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border text-[14.5px] font-bold ${
        on ? 'border-2 border-ok bg-ok-bg text-ok' : 'border-line bg-white text-muted'
      }`}
    >
      <Box on={on} />
      {label}
    </button>
  );
}

/**
 * Fakturert og Betalt er to uavhengige dimensjoner i datamodellen, og her –
 * på ordredetaljene – holdes de uavhengige, så enhver kombinasjon er
 * tilgjengelig. Ordrelista viser samme tilstand som én brikke i tre trinn,
 * fordi det er den rekkefølgen som gjelder i praksis.
 */
export function EconomyChecks({
  orderId,
  kunde,
  invoiced,
  paid,
}: {
  orderId: string;
  kunde: string;
  invoiced: boolean;
  paid: boolean;
}) {
  const inv = useOptimisticField(invoiced);
  const pay = useOptimisticField(paid);

  return (
    <div className="flex gap-2">
      <Toggle
        on={inv.value}
        label="Fakturert"
        onToggle={(next) =>
          inv.run(next, {
            action: () => setInvoiced(orderId, next),
            message: `${kunde} · ${next ? 'fakturert' : 'ikke fakturert'}`,
            undo: () => setInvoiced(orderId, !next),
          })
        }
      />
      <Toggle
        on={pay.value}
        label="Betalt"
        onToggle={(next) =>
          pay.run(next, {
            action: () => setPaid(orderId, next),
            message: `${kunde} · ${next ? 'betalt' : 'ikke betalt'}`,
            undo: () => setPaid(orderId, !next),
          })
        }
      />
    </div>
  );
}

export function TestFlag({
  orderId,
  kunde,
  isTest,
}: {
  orderId: string;
  kunde: string;
  isTest: boolean;
}) {
  const flag = useOptimisticField(isTest);
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-[13px] text-muted">
      <input
        type="checkbox"
        checked={flag.value}
        onChange={(e) => {
          const next = e.target.checked;
          flag.run(next, {
            action: () => setTestFlag(orderId, next),
            message: `${kunde} · ${next ? 'markert som testordre' : 'ikke lenger testordre'}`,
            undo: () => setTestFlag(orderId, !next),
          });
        }}
        className="focus-ring h-4 w-4 accent-brand"
      />
      Marker som testordre
      <span className="ml-auto text-xs">Skjules fra tall og lister</span>
    </label>
  );
}
