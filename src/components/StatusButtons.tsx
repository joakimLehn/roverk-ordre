'use client';

import { BUILD_STATUSES, BUILD_STATUS_LABELS } from '@/lib/status';
import type { BuildStatus } from '@/lib/types';
import { setBuildStatus } from '@/app/ordre/[id]/actions';
import { useOptimisticField } from './useOptimisticField';

// Mobil: 2×2 rutenett med store flater. Skrivebord: kompakt rad.
export function StatusButtons({
  orderId,
  kunde,
  current,
}: {
  orderId: string;
  kunde: string;
  current: BuildStatus;
}) {
  const status = useOptimisticField(current);

  return (
    <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-1.5">
      {BUILD_STATUSES.map((s) => (
        <button
          key={s}
          aria-pressed={s === status.value}
          onClick={() => {
            if (s === status.value) return;
            const prev = status.value;
            status.run(s, {
              action: () => setBuildStatus(orderId, s),
              message: `${kunde} · ${BUILD_STATUS_LABELS[s].toLowerCase()}`,
              undo: () => setBuildStatus(orderId, prev),
            });
          }}
          className={`focus-ring min-h-[52px] cursor-pointer rounded-xl border px-3 text-[14.5px] font-bold md:min-h-0 md:rounded-lg md:py-1.5 md:text-[13px] md:font-semibold ${
            s === status.value
              ? 'border-2 border-info bg-info-bg text-info md:border'
              : 'border-line bg-white text-muted'
          }`}
        >
          {BUILD_STATUS_LABELS[s]}
        </button>
      ))}
    </div>
  );
}
