'use client';

import { useState } from 'react';
import { setInspectionStatus } from '@/app/befaringer/[id]/actions';
import {
  INSPECTION_STATUS_LABELS,
  type InspectionStatus,
} from '@/lib/inspection';
import { InspectionStatusSheet, INSPECTION_STATUS_STYLES } from './InspectionStatusSheet';
import { useOptimisticField } from './useOptimisticField';

export function InspectionStatusChip({
  inspectionId,
  name,
  current,
  className,
}: {
  inspectionId: string;
  name: string;
  current: InspectionStatus;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const status = useOptimisticField(current);

  function choose(next: InspectionStatus) {
    if (next === status.value) return;
    const prev = status.value;
    status.run(next, {
      action: () => setInspectionStatus(inspectionId, next),
      message: `${name} · ${INSPECTION_STATUS_LABELS[next].toLowerCase()}`,
      undo: () => setInspectionStatus(inspectionId, prev),
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={`${
          className ??
          'focus-ring flex min-h-[38px] cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-line px-2.5 text-[12.5px] font-bold'
        } ${INSPECTION_STATUS_STYLES[status.value]}`}
      >
        {INSPECTION_STATUS_LABELS[status.value]}
        <svg width="8" height="6" viewBox="0 0 10 7" fill="none" aria-hidden="true" className="opacity-55">
          <path d="M1 1.5L5 5.5L9 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <InspectionStatusSheet
          current={status.value}
          title={name}
          onChoose={choose}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
