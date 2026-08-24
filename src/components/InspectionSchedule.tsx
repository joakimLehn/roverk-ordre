'use client';

import { useState, useTransition } from 'react';
import { setInspectionSchedule } from '@/app/befaringer/[id]/actions';

const input =
  'min-h-[50px] w-full rounded-xl border border-line bg-white px-3 text-base md:min-h-0 md:rounded-lg md:px-2.5 md:py-2 md:text-sm';

export function InspectionSchedule({
  inspectionId,
  scheduledOn,
  scheduledTime,
}: {
  inspectionId: string;
  scheduledOn: string | null;
  scheduledTime: string | null;
}) {
  const [date, setDate] = useState(scheduledOn ?? '');
  const [time, setTime] = useState(scheduledTime ?? '');
  const [error, setError] = useState<string | undefined>();
  const [pending, start] = useTransition();

  function save(nextOn: string, nextTime: string) {
    start(async () => {
      const r = await setInspectionSchedule(inspectionId, nextOn, nextTime);
      setError(r.message);
    });
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <label className="text-xs font-semibold text-muted">
          Dato
          <input
            type="date"
            value={date}
            disabled={pending}
            onChange={(e) => {
              const v = e.target.value;
              setDate(v);
              if (!v) {
                setTime('');
                save('', '');
              } else {
                save(v, time);
              }
            }}
            className={`${input} mt-1`}
          />
        </label>
        <label className="text-xs font-semibold text-muted">
          Klokkeslett
          <input
            type="time"
            value={time}
            disabled={pending}
            onChange={(e) => {
              const v = e.target.value;
              setTime(v);
              save(date, v);
            }}
            className={`${input} mt-1`}
          />
        </label>
      </div>
      {error ? <p className="mt-1.5 text-sm font-semibold text-danger">{error}</p> : null}
    </div>
  );
}
