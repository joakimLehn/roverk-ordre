'use client';

import { useTransition } from 'react';
import { setInvoiced, setPaid, setTestFlag } from '@/app/ordre/[id]/actions';

export function EconomyChecks({ orderId, invoiced, paid }: { orderId: string; invoiced: boolean; paid: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-5 text-sm">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={invoiced}
          disabled={pending}
          onChange={(e) => start(() => setInvoiced(orderId, e.target.checked))}
        />
        Fakturert
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={paid}
          disabled={pending}
          onChange={(e) => start(() => setPaid(orderId, e.target.checked))}
        />
        Betalt
      </label>
    </div>
  );
}

export function TestFlag({ orderId, isTest }: { orderId: string; isTest: boolean }) {
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center gap-2 text-[13px] text-muted">
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
