'use client';

import { useEffect, useRef, useState } from 'react';
import { inspectionFileHref } from '@/lib/inspection-file';
import type { InspectionFileView } from '@/lib/inspection-file';

export function ImageLightbox({
  inspectionId,
  file,
  onClose,
  onDelete,
}: {
  inspectionId: string;
  file: InspectionFileView;
  onClose: () => void;
  onDelete: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [broken, setBroken] = useState(false);
  const href = inspectionFileHref(inspectionId, file.id);

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
      aria-label={file.filename}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto max-h-[min(92vh,900px)] w-[min(100%,42rem)] rounded-2xl bg-white p-3 shadow-2xl backdrop:bg-ink/45"
    >
      {broken ? (
        <p className="px-2 py-8 text-center text-sm text-muted">{file.filename}</p>
      ) : (
        // Vanlig img: src er vår autentiserte rute som redirecter til signert URL.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={href}
          alt={file.filename}
          onError={() => setBroken(true)}
          className="max-h-[min(70vh,720px)] w-full rounded-xl object-contain"
        />
      )}
      <p className="mt-2 truncate px-1 text-[13px] text-muted">{file.filename}</p>
      <div className="mt-2 flex flex-col gap-2 md:flex-row">
        <button
          type="button"
          onClick={onClose}
          className="focus-ring min-h-[46px] flex-1 cursor-pointer rounded-xl border border-line bg-white px-3.5 text-[14.5px] font-bold"
        >
          Lukk
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="focus-ring min-h-[46px] flex-1 cursor-pointer rounded-xl bg-danger px-3.5 text-[14.5px] font-bold text-white"
        >
          Slett
        </button>
      </div>
    </dialog>
  );
}
