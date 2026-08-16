'use client';

import { useState, useTransition } from 'react';
import type { Order } from '@/lib/types';
import { saveCustomer } from '@/app/ordre/[id]/actions';

export function CustomerForm({ order }: { order: Order }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  if (!editing) {
    return (
      <div className="grid grid-cols-[110px_1fr] gap-y-1 text-[13.5px]">
        <span className="text-muted">Navn</span><span>{order.name}</span>
        <span className="text-muted">Telefon</span>
        {order.phone ? (
          <a href={`tel:${order.phone}`} className="underline-offset-2 hover:underline">{order.phone}</a>
        ) : (
          <span>–</span>
        )}
        <span className="text-muted">E-post</span>
        {order.email ? (
          <a href={`mailto:${order.email}`} className="underline-offset-2 hover:underline">{order.email}</a>
        ) : (
          <span>–</span>
        )}
        <span className="text-muted">Adresse</span><span>{order.address ?? '–'}</span>
        <span className="text-muted">Ønsket dato</span><span>{order.preferred_date ?? '–'}</span>
        <button
          onClick={() => setEditing(true)}
          className="col-span-2 mt-1 flex min-h-[40px] w-fit cursor-pointer items-center text-[13.5px] font-semibold text-brand"
        >
          Rediger kundeinfo
        </button>
      </div>
    );
  }

  const input = 'min-h-[46px] w-full rounded-lg border border-line bg-white px-3 py-2 text-base sm:text-sm';
  return (
    <form
      action={(fd) => start(async () => { await saveCustomer(order.id, fd); setEditing(false); })}
      className="grid gap-2 text-sm"
    >
      <input name="name" defaultValue={order.name} placeholder="Navn" required className={input} />
      <input name="phone" defaultValue={order.phone ?? ''} placeholder="Telefon" className={input} />
      <input name="email" type="email" defaultValue={order.email ?? ''} placeholder="E-post" className={input} />
      <input name="address" defaultValue={order.address ?? ''} placeholder="Adresse" className={input} />
      <label className="text-xs text-muted">
        Ønsket dato
        <input name="preferred_date" type="date" defaultValue={order.preferred_date ?? ''} className={`${input} mt-1`} />
      </label>
      <div className="flex gap-2">
        <button
          disabled={pending}
          className="min-h-[46px] flex-1 cursor-pointer rounded-lg bg-brand px-3.5 text-[14.5px] font-bold text-white disabled:opacity-60 sm:min-h-0 sm:flex-none sm:py-2 sm:text-[13px] sm:font-semibold"
        >
          {pending ? 'Lagrer …' : 'Lagre'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="min-h-[46px] flex-1 cursor-pointer rounded-lg border border-line bg-white px-3.5 text-[14.5px] font-semibold sm:min-h-0 sm:flex-none sm:py-2 sm:text-[13px] sm:font-normal"
        >
          Avbryt
        </button>
      </div>
    </form>
  );
}
