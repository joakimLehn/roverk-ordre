'use client';

// Redigering rett fra ordrelista: byggstatus-nedtrekk og fakturert/betalt-
// avhukinger per rad, uten å måtte inn på ordredetaljene.
import { useTransition } from 'react';
import { BUILD_STATUSES, BUILD_STATUS_LABELS } from '@/lib/status';
import type { BuildStatus } from '@/lib/types';
import { setBuildStatus, setInvoiced, setPaid } from '@/app/ordre/[id]/actions';

const SELECT_STYLES: Record<BuildStatus, string> = {
  ny: 'bg-warn-bg text-warn',
  under_bygging: 'bg-info-bg text-info',
  bygd: 'bg-line text-ink',
  montert: 'bg-ok-bg text-ok',
};

export function StatusSelect({ orderId, current }: { orderId: string; current: BuildStatus }) {
  const [pending, start] = useTransition();
  return (
    <select
      value={current}
      disabled={pending}
      onChange={(e) => start(() => setBuildStatus(orderId, e.target.value))}
      className={`cursor-pointer rounded-full border-0 px-2.5 py-1 text-[11.5px] font-bold disabled:opacity-60 ${SELECT_STYLES[current]}`}
    >
      {BUILD_STATUSES.map((s) => (
        <option key={s} value={s}>{BUILD_STATUS_LABELS[s]}</option>
      ))}
    </select>
  );
}

export function InlineEconomy({ orderId, invoiced, paid }: { orderId: string; invoiced: boolean; paid: boolean }) {
  const [pending, start] = useTransition();
  return (
    <span className="flex items-center gap-3 text-xs whitespace-nowrap">
      <label className="flex cursor-pointer items-center gap-1" title="Fakturert">
        <input
          type="checkbox"
          checked={invoiced}
          disabled={pending}
          onChange={(e) => start(() => setInvoiced(orderId, e.target.checked))}
        />
        <span className={invoiced ? 'font-bold text-ok' : 'text-muted'}>Fakt.</span>
      </label>
      <label className="flex cursor-pointer items-center gap-1" title="Betalt">
        <input
          type="checkbox"
          checked={paid}
          disabled={pending}
          onChange={(e) => start(() => setPaid(orderId, e.target.checked))}
        />
        <span className={paid ? 'font-bold text-ok' : 'text-muted'}>Bet.</span>
      </label>
    </span>
  );
}
