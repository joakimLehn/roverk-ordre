'use client';

import { useState, useTransition } from 'react';
import { removeInspection } from '@/app/befaringer/[id]/actions';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export function InspectionDelete({ inspectionId, name }: { inspectionId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="border-t border-dashed border-line pt-4">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="focus-ring min-h-[46px] cursor-pointer text-[14px] font-semibold text-danger"
      >
        Slett befaring
      </button>
      {open ? (
        <ConfirmDialog
          title="Slett befaringen?"
          message={`«${name}» og alle vedlegg slettes for godt.`}
          confirmLabel={pending ? 'Sletter …' : 'Slett'}
          onConfirm={() => start(() => removeInspection(inspectionId))}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}
