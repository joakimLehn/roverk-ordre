'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { createInspection, type NewInspectionState } from './actions';
import { KANALER } from '@/lib/manual-order';
import { INSPECTION_PRODUCTS, INSPECTION_PRODUCT_LABELS } from '@/lib/inspection';

const input = 'min-h-[46px] w-full rounded-lg border border-line bg-white px-3 py-2 text-base md:text-sm';
const label = 'block text-xs font-semibold text-muted';

export function NewInspectionForm() {
  const [state, formAction, pending] = useActionState<NewInspectionState, FormData>(createInspection, {});

  return (
    <form action={formAction} className="grid max-w-xl gap-3.5">
      <label className={label}>
        Navn *
        <input name="name" required className={`${input} mt-1`} />
      </label>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className={label}>
          Telefon
          <input name="phone" type="tel" className={`${input} mt-1`} />
        </label>
        <label className={label}>
          E-post
          <input name="email" type="email" className={`${input} mt-1`} />
        </label>
      </div>

      <label className={label}>
        Adresse
        <input name="address" className={`${input} mt-1`} />
      </label>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className={label}>
          Avtalt dato
          <input name="scheduled_on" type="date" className={`${input} mt-1`} />
        </label>
        <label className={label}>
          Klokkeslett
          <input name="scheduled_time" type="time" className={`${input} mt-1`} />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className={label}>
          Produkt
          <select name="product" defaultValue="" className={`${input} mt-1`}>
            <option value="">Velg …</option>
            {INSPECTION_PRODUCTS.map((p) => (
              <option key={p} value={p}>{INSPECTION_PRODUCT_LABELS[p]}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          Kanal
          <select name="kanal" defaultValue="E-post" className={`${input} mt-1`}>
            {KANALER.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
      </div>

      <label className={label}>
        Internt notat
        <textarea name="notes" rows={3} className={`${input} mt-1`} />
      </label>

      {state.message ? <p className="text-sm font-semibold text-danger">{state.message}</p> : null}

      <div className="flex gap-2">
        <button
          disabled={pending}
          className="min-h-[50px] flex-1 cursor-pointer rounded-xl bg-brand px-4 text-[15px] font-bold text-white disabled:opacity-60 md:flex-none md:rounded-lg md:py-2.5 md:text-sm md:font-semibold"
        >
          {pending ? 'Lagrer …' : 'Opprett befaring'}
        </button>
        <Link href="/befaringer" className="flex min-h-[50px] items-center justify-center rounded-xl border border-line bg-white px-5 text-[15px] font-bold md:min-h-0 md:rounded-lg md:py-2.5 md:text-sm md:font-semibold">
          Avbryt
        </Link>
      </div>
    </form>
  );
}
