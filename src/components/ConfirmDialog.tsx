'use client';

import { useEffect, useRef } from 'react';

/**
 * Bekreftelse for ødeleggende handlinger (slett fil / slett befaring).
 * Åpen-tilstanden eies av React, samme regel som StatusSheet.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
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
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-0 mt-auto w-full max-w-md rounded-t-2xl bg-white px-3.5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 shadow-2xl backdrop:bg-ink/45 md:m-auto md:rounded-2xl md:pb-4"
    >
      <h4 id="confirm-title" className="text-[16px] font-extrabold">
        {title}
      </h4>
      <p className="mt-1.5 mb-4 text-[14.5px] text-muted">{message}</p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="focus-ring min-h-[46px] w-full cursor-pointer rounded-xl bg-danger px-3.5 text-[15px] font-bold text-white"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="focus-ring min-h-[46px] w-full cursor-pointer rounded-xl border border-line bg-white px-3.5 text-[15px] font-semibold"
        >
          Avbryt
        </button>
      </div>
    </dialog>
  );
}
