'use client';

import { setInspectionStatus } from '@/app/befaringer/[id]/actions';
import {
  INSPECTION_STATUSES,
  INSPECTION_STATUS_LABELS,
  type InspectionStatus,
} from '@/lib/inspection';
import { useOptimisticField } from './useOptimisticField';

export function InspectionStatusButtons({
  inspectionId,
  kunde,
  current,
}: {
  inspectionId: string;
  kunde: string;
  current: InspectionStatus;
}) {
  const status = useOptimisticField(current);

  function choose(next: InspectionStatus) {
    if (next === status.value) return;
    const prev = status.value;
    status.run(next, {
      action: () => setInspectionStatus(inspectionId, next),
      message: `${kunde} · ${INSPECTION_STATUS_LABELS[next].toLowerCase()}`,
      undo: () => setInspectionStatus(inspectionId, prev),
    });
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 md:flex md:flex-wrap md:gap-1.5">
        {INSPECTION_STATUSES.map((s) => (
          <button
            key={s}
            aria-pressed={s === status.value}
            onClick={() => choose(s)}
            className={`focus-ring min-h-[52px] cursor-pointer rounded-xl border px-3 text-[14.5px] font-bold md:min-h-0 md:rounded-lg md:py-1.5 md:text-[13px] md:font-semibold ${
              s === status.value
                ? 'border-2 border-info bg-info-bg text-info md:border'
                : 'border-line bg-white text-muted'
            }`}
          >
            {INSPECTION_STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      {status.value === 'aktiv' ? (
        <button
          type="button"
          onClick={() => choose('gjennomfort')}
          className="focus-ring mt-2 min-h-[44px] w-full cursor-pointer rounded-xl bg-brand px-3.5 text-[14.5px] font-bold text-white md:w-auto md:rounded-lg md:px-4 md:py-2 md:text-[13px] md:font-semibold"
        >
          Merk som gjennomført
        </button>
      ) : null}
    </div>
  );
}
