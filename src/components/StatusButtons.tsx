'use client';

import { useTransition } from 'react';
import { BUILD_STATUSES, BUILD_STATUS_LABELS } from '@/lib/status';
import type { BuildStatus } from '@/lib/types';
import { setBuildStatus } from '@/app/ordre/[id]/actions';

export function StatusButtons({ orderId, current }: { orderId: string; current: BuildStatus }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-1.5">
      {BUILD_STATUSES.map((s) => (
        <button
          key={s}
          disabled={pending}
          onClick={() => start(() => setBuildStatus(orderId, s))}
          className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[13px] font-semibold disabled:opacity-60 ${
            s === current ? 'border-info bg-info-bg text-info' : 'border-line bg-white text-muted'
          }`}
        >
          {BUILD_STATUS_LABELS[s]}
        </button>
      ))}
    </div>
  );
}
