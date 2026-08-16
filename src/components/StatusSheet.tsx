'use client';

// Bunnark for statusvalg. Store trykkflater – appen brukes stående, ofte med
// hansker, så nedtrekksmenyer treffer dårlig.
import { useEffect, useTransition } from 'react';
import { BUILD_STATUSES, BUILD_STATUS_LABELS } from '@/lib/status';
import type { BuildStatus } from '@/lib/types';
import { setBuildStatus } from '@/app/ordre/[id]/actions';

const OPTION_STYLES: Record<BuildStatus, string> = {
  ny: 'bg-warn-bg text-warn',
  under_bygging: 'bg-info-bg text-info',
  bygd: 'bg-sand text-ink',
  montert: 'bg-ok-bg text-ok',
};

export function StatusSheet({
  orderId,
  current,
  title,
  onClose,
}: {
  orderId: string;
  current: BuildStatus;
  title: string;
  onClose: () => void;
}) {
  const [pending, start] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  function choose(s: BuildStatus) {
    start(async () => {
      await setBuildStatus(orderId, s);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="Lukk"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/45"
      />
      <div className="relative w-full max-w-md rounded-t-2xl bg-white px-3.5 pb-6 pt-2 shadow-2xl sm:rounded-2xl sm:pb-4">
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-line" />
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Byggstatus</h4>
        <p className="mb-3.5 text-[15px] font-bold">{title}</p>
        {BUILD_STATUSES.map((s) => (
          <button
            key={s}
            disabled={pending}
            onClick={() => choose(s)}
            className={`mb-2 flex min-h-[54px] w-full items-center gap-3 rounded-xl px-3.5 text-[15.5px] font-semibold disabled:opacity-60 ${OPTION_STYLES[s]} ${
              s === current ? 'border-2 border-current' : 'border border-line'
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-current" />
            {BUILD_STATUS_LABELS[s]}
            {s === current ? <span className="ml-auto">✓</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
