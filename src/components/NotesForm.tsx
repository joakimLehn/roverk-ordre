'use client';

import { useState, useTransition } from 'react';
import { saveNotes, setPlannedDate } from '@/app/ordre/[id]/actions';

export function NotesForm({ orderId, notes }: { orderId: string; notes: string }) {
  const [value, setValue] = useState(notes);
  const [pending, start] = useTransition();
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        className="w-full rounded-xl border border-line bg-white p-3 text-base sm:rounded-lg sm:p-2.5 sm:text-[13.5px]"
      />
      <button
        disabled={pending}
        onClick={() => start(() => saveNotes(orderId, value))}
        className="mt-2 min-h-[46px] w-full cursor-pointer rounded-xl border border-line bg-white px-3.5 text-[14.5px] font-bold disabled:opacity-60 sm:min-h-0 sm:w-auto sm:rounded-lg sm:py-2 sm:text-[13px] sm:font-semibold"
      >
        {pending ? 'Lagrer …' : 'Lagre notat'}
      </button>
    </div>
  );
}

export function PlannedDate({ orderId, date }: { orderId: string; date: string }) {
  const [pending, start] = useTransition();
  return (
    <input
      type="date"
      defaultValue={date}
      disabled={pending}
      onChange={(e) => start(() => setPlannedDate(orderId, e.target.value))}
      className="min-h-[50px] w-full rounded-xl border border-line bg-white px-3 text-base sm:min-h-0 sm:w-auto sm:rounded-lg sm:px-2.5 sm:py-2 sm:text-sm"
    />
  );
}
