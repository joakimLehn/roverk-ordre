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
        className="w-full rounded-lg border border-line bg-white p-2.5 text-[13.5px]"
      />
      <button
        disabled={pending}
        onClick={() => start(() => saveNotes(orderId, value))}
        className="mt-1.5 cursor-pointer rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-semibold disabled:opacity-60"
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
      className="rounded-lg border border-line bg-white px-2.5 py-2 text-sm"
    />
  );
}
