'use client';

import { useState, useTransition } from 'react';
import { setDelivery } from '@/app/ordre/[id]/actions';

const input =
  'min-h-[50px] w-full rounded-xl border border-line bg-white px-3 text-base md:min-h-0 md:rounded-lg md:px-2.5 md:py-2 md:text-sm';

/**
 * Avtalt leveringsdato og klokkeslett. Lagrer ved hver endring, som
 * byggedatoen. Tømmes datoen, tømmes klokka også – klokke alene lagres ikke.
 */
export function DeliverySchedule({
  orderId,
  date: initialDate,
  time: initialTime,
}: {
  orderId: string;
  date: string | null;
  time: string | null;
}) {
  const [date, setDate] = useState(initialDate ?? '');
  const [time, setTime] = useState(initialTime ?? '');
  const [error, setError] = useState<string | undefined>();
  const [pending, start] = useTransition();

  function save(nextDate: string, nextTime: string) {
    start(async () => {
      const r = await setDelivery(orderId, nextDate, nextTime);
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
