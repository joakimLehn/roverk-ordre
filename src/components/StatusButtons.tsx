'use client';

import { useTransition } from 'react';
import { BUILD_STATUSES, BUILD_STATUS_LABELS } from '@/lib/status';
import type { BuildStatus } from '@/lib/types';
import { setBuildStatus } from '@/app/ordre/[id]/actions';

// Mobil: 2×2 rutenett med store flater. Skrivebord: kompakt rad.
export function StatusButtons({ orderId, current }: { orderId: string; current: BuildStatus }) {
  const [pending, start] = useTransition();
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-1.5">
      {BUILD_STATUSES.map((s) => (
        <button
          key={s}
          disabled={pending}
          onClick={() => start(() => setBuildStatus(orderId, s))}
          className={`min-h-[52px] cursor-pointer rounded-xl border px-3 text-[14.5px] font-bold disabled:opacity-60 sm:min-h-0 sm:rounded-lg sm:py-1.5 sm:text-[13px] sm:font-semibold ${
            s === current
              ? 'border-2 border-info bg-info-bg text-info sm:border'
              : 'border-line bg-white text-muted'
          }`}
        >
          {BUILD_STATUS_LABELS[s]}
        </button>
      ))}
    </div>
  );
}
