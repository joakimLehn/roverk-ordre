'use client';

// Bunnark for befaringsstatus. Samme dialog-regler som StatusSheet:
// React eier åpen-tilstand, preventDefault på cancel, klikk i backdrop.
// Ikke utvid StatusSheet – den er ordre-spesifikk (BuildStatus).

import { useEffect, useRef } from 'react';
import {
  INSPECTION_STATUSES,
  INSPECTION_STATUS_LABELS,
  type InspectionStatus,
} from '@/lib/inspection';

export const INSPECTION_STATUS_STYLES: Record<InspectionStatus, string> = {
  aktiv: 'bg-info-bg text-info',
  gjennomfort: 'bg-ok-bg text-ok',
  avlyst: 'bg-sand text-muted',
};

export function InspectionStatusSheet({
  current,
  title,
  onChoose,
  onClose,
}: {
  current: InspectionStatus;
  title: string;
  onChoose: (status: InspectionStatus) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!el.open) el.showModal();
    return () => {
      if (el.open) el.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label="Velg befaringsstatus"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-0 mt-auto w-full max-w-md rounded-t-2xl bg-white px-3.5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-2 shadow-2xl backdrop:bg-ink/45 md:m-auto md:rounded-2xl md:pb-4"
    >
      <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-line md:hidden" />
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Status</h4>
      <p className="mb-3.5 text-[15px] font-bold">{title}</p>
      {INSPECTION_STATUSES.map((s) => (
        <button
          key={s}
          onClick={() => {
            if (s !== current) onChoose(s);
            onClose();
          }}
          className={`focus-ring mb-2 flex min-h-[54px] w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 text-[15.5px] font-semibold ${INSPECTION_STATUS_STYLES[s]} ${
            s === current ? 'border-2 border-current' : 'border border-line'
          }`}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-current" aria-hidden="true" />
          {INSPECTION_STATUS_LABELS[s]}
          {s === current ? <span className="ml-auto">✓</span> : null}
        </button>
      ))}
    </dialog>
  );
}
