'use client';

// Redigering rett fra ordrelista på skrivebord: byggstatus per rad, uten å
// måtte inn på ordredetaljene.
import { BUILD_STATUSES, BUILD_STATUS_LABELS } from '@/lib/status';
import type { BuildStatus } from '@/lib/types';
import { setBuildStatus } from '@/app/ordre/[id]/actions';
import { useOptimisticField } from './useOptimisticField';

const SELECT_STYLES: Record<BuildStatus, string> = {
  ny: 'bg-warn-bg text-warn',
  under_bygging: 'bg-info-bg text-info',
  bygd: 'bg-line text-ink',
  montert: 'bg-ok-bg text-ok',
};

export function StatusSelect({
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
    <select
      aria-label={`Byggstatus for ${kunde}`}
      value={status.value}
      onChange={(e) => {
        const next = e.target.value as BuildStatus;
        const prev = status.value;
        status.run(next, {
          action: () => setBuildStatus(orderId, next),
          message: `${kunde} · ${BUILD_STATUS_LABELS[next].toLowerCase()}`,
          undo: () => setBuildStatus(orderId, prev),
        });
      }}
      /* Raden er klikkbar; nedtrekket skal ikke åpne ordren i tillegg. */
      onClick={(e) => e.stopPropagation()}
      className={`focus-ring min-h-[30px] cursor-pointer rounded-full border-0 px-2.5 py-1 text-[11.5px] font-bold ${SELECT_STYLES[status.value]}`}
    >
      {BUILD_STATUSES.map((s) => (
        <option key={s} value={s}>{BUILD_STATUS_LABELS[s]}</option>
      ))}
    </select>
  );
}
