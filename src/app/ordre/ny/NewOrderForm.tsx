'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { createOrder, type NewOrderState } from './actions';
import { KANALER } from '@/lib/manual-order';
import { ProductConfigFields } from '@/components/ProductConfigFields';

const input = 'min-h-[46px] w-full rounded-lg border border-line bg-white px-3 py-2 text-base sm:text-sm';
const label = 'block text-xs font-semibold text-muted';

export function NewOrderForm() {
  const [state, formAction, pending] = useActionState<NewOrderState, FormData>(createOrder, {});
  const [site, setSite] = useState('');

  return (
    <form action={formAction} className="grid max-w-xl gap-3.5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={label}>
          Produkt *
          <select
            name="site"
            required
            value={site}
            onChange={(e) => setSite(e.target.value)}
            className={`${input} mt-1`}
          >
            <option value="" disabled>Velg …</option>
            <option value="skjul">Skjul</option>
            <option value="ved">Ved</option>
            <option value="orden">Orden</option>
          </select>
        </label>
        <label className={label}>
          Kanal
          <select name="kanal" defaultValue="E-post" className={`${input} mt-1`}>
            {KANALER.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
      </div>

      {site ? <ProductConfigFields site={site} /> : null}

      <label className={label}>
        Kundenavn *
        <input name="name" required className={`${input} mt-1`} />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={label}>
          Pris (kr)
          <input name="price_nok" inputMode="numeric" placeholder="64 900" className={`${input} mt-1`} />
        </label>
        <label className={label}>
          Ønsket dato
          <input name="preferred_date" type="date" className={`${input} mt-1`} />
        </label>
      </div>

      <label className={label}>
        Internt notat
        <textarea name="notes" rows={3} placeholder="F.eks. «Bestilt via DM, vil ha levering i september»" className={`${input} mt-1`} />
      </label>

      {state.message ? <p className="text-sm font-semibold text-danger">{state.message}</p> : null}

      <div className="flex gap-2">
        <button
          disabled={pending}
          className="min-h-[50px] flex-1 cursor-pointer rounded-xl bg-brand px-4 text-[15px] font-bold text-white disabled:opacity-60 sm:flex-none sm:rounded-lg sm:py-2.5 sm:text-sm sm:font-semibold"
        >
          {pending ? 'Lagrer …' : 'Opprett ordre'}
        </button>
        <Link href="/" className="flex min-h-[50px] items-center justify-center rounded-xl border border-line bg-white px-5 text-[15px] font-bold sm:min-h-0 sm:rounded-lg sm:py-2.5 sm:text-sm sm:font-semibold">
          Avbryt
        </Link>
      </div>
    </form>
  );
}
