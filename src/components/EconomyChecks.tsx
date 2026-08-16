'use client';

import { useTransition } from 'react';
import { setInvoiced, setPaid, setTestFlag } from '@/app/ordre/[id]/actions';

function Toggle({
  on,
  label,
  disabled,
  onToggle,
}: {
  on: boolean;
  label: string;
  disabled: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={() => onToggle(!on)}
      className={`flex min-h-[52px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border text-[14.5px] font-bold disabled:opacity-60 ${
        on ? 'border-2 border-ok bg-ok-bg text-ok' : 'border-line bg-white text-muted'
      }`}
    >
      <span
        className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border-[1.5px] text-[11px] text-white ${
          on ? 'border-ok bg-ok' : 'border-muted'
        }`}
      >
        {on ? '✓' : ''}
      </span>
      {label}
    </button>
  );
}

export function EconomyChecks({ orderId, invoiced, paid }: { orderId: string; invoiced: boolean; paid: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      <Toggle
        on={invoiced}
        label="Fakturert"
        disabled={pending}
        onToggle={(next) => start(() => setInvoiced(orderId, next))}
      />
      <Toggle
        on={paid}
        label="Betalt"
        disabled={pending}
        onToggle={(next) => start(() => setPaid(orderId, next))}
      />
    </div>
  );
}

export function TestFlag({ orderId, isTest }: { orderId: string; isTest: boolean }) {
  const [pending, start] = useTransition();
  return (
    <label className="flex min-h-[44px] items-center gap-2.5 text-[13px] text-muted">
      <input
        type="checkbox"
        checked={isTest}
        disabled={pending}
        onChange={(e) => start(() => setTestFlag(orderId, e.target.checked))}
      />
      Marker som testordre
      <span className="ml-auto text-xs">Skjules fra tall og lister</span>
    </label>
  );
}
