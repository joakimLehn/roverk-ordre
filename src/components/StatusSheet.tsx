'use client';

// Bunnark for statusvalg. Store trykkflater – appen brukes stående, ofte med
// hansker, så nedtrekksmenyer treffer dårlig.
//
// Bygget på <dialog>.showModal() slik at nettleseren står for fokusfellen,
// Escape og inert bakgrunn. Arket eier ikke skrivingen; det rapporterer valget
// oppover til kortet, som har den optimistiske tilstanden.

import { useEffect, useRef } from 'react';
import { BUILD_STATUSES, BUILD_STATUS_LABELS } from '@/lib/status';
import type { BuildStatus } from '@/lib/types';

const OPTION_STYLES: Record<BuildStatus, string> = {
  ny: 'bg-warn-bg text-warn',
  under_bygging: 'bg-info-bg text-info',
  bygd: 'bg-sand text-ink',
  montert: 'bg-ok-bg text-ok',
};

export function StatusSheet({
  current,
  title,
  onChoose,
  onClose,
}: {
  current: BuildStatus;
  title: string;
  onChoose: (status: BuildStatus) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || el.open) return;
    el.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label="Velg byggstatus"
      onClose={onClose}
      onCancel={onClose}
      /* Bunnark på mobil, midtstilt kort på skrivebord. ::backdrop er
         nettleserens eget overlegg – vi trenger ingen egen bakgrunnsknapp. */
      onClick={(e) => {
        // Klikk utenfor panelet treffer <dialog> selv, ikke innholdet.
        if (e.target === ref.current) ref.current?.close();
      }}
      className="m-0 mt-auto w-full max-w-md rounded-t-2xl bg-white px-3.5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-2 shadow-2xl backdrop:bg-ink/45 open:flex open:flex-col md:m-auto md:rounded-2xl md:pb-4"
    >
      <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-line md:hidden" />
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted">Byggstatus</h4>
      <p className="mb-3.5 text-[15px] font-bold">{title}</p>
      {BUILD_STATUSES.map((s) => (
        <button
          key={s}
          onClick={() => {
            ref.current?.close();
            if (s !== current) onChoose(s);
          }}
          className={`focus-ring mb-2 flex min-h-[54px] w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 text-[15.5px] font-semibold ${OPTION_STYLES[s]} ${
            s === current ? 'border-2 border-current' : 'border border-line'
          }`}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-current" />
          {BUILD_STATUS_LABELS[s]}
          {s === current ? <span className="ml-auto" aria-label="Valgt">✓</span> : null}
        </button>
      ))}
    </dialog>
  );
}
