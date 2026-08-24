'use client';

import { useState, useTransition } from 'react';
import { saveInspectionNotes } from '@/app/befaringer/[id]/actions';

export function InspectionNotesForm({
  inspectionId,
  notes,
}: {
  inspectionId: string;
  notes: string;
}) {
  const [value, setValue] = useState(notes);
  const [pending, start] = useTransition();
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        className="w-full rounded-xl border border-line bg-white p-3 text-base md:rounded-lg md:p-2.5 md:text-[13.5px]"
      />
      <button
        disabled={pending}
        onClick={() => start(() => saveInspectionNotes(inspectionId, value))}
        className="mt-2 min-h-[46px] w-full cursor-pointer rounded-xl border border-line bg-white px-3.5 text-[14.5px] font-bold disabled:opacity-60 md:min-h-0 md:w-auto md:rounded-lg md:py-2 md:text-[13px] md:font-semibold"
      >
        {pending ? 'Lagrer …' : 'Lagre notat'}
      </button>
    </div>
  );
}
