'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { createOrder, type NewOrderState } from './actions';
import { KANALER } from '@/lib/manual-order';

const input = 'min-h-[46px] w-full rounded-lg border border-line bg-white px-3 py-2 text-base sm:text-sm';
const label = 'block text-xs font-semibold text-muted';

function SkjulFields() {
  return (
    <fieldset className="grid gap-3 rounded-xl border border-line bg-sand/60 p-3.5">
      <legend className="px-1 text-xs font-semibold text-muted">Skjul-konfigurasjon</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className={label}>
          Antall dunker *
          <select name="skjul_count" defaultValue="4" className={`${input} mt-1`}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className={label}>
          Serie *
          <select name="skjul_serie" defaultValue="Standard" className={`${input} mt-1`}>
            <option value="Standard">Standard</option>
            <option value="XL">XL</option>
          </select>
        </label>
        <label className={label}>
          Kledning *
          <select name="skjul_kledning" defaultValue="ubeh" className={`${input} mt-1`}>
            <option value="ubeh">Impregnert</option>
            <option value="royal">Royal</option>
          </select>
        </label>
      </div>
      <div className="flex gap-6">
        <label className="flex min-h-[44px] items-center gap-2.5 text-[15px]"><input type="checkbox" name="skjul_montering" defaultChecked /> Montering</label>
        <label className="flex min-h-[44px] items-center gap-2.5 text-[15px]"><input type="checkbox" name="skjul_forankring" /> Forankring</label>
      </div>
    </fieldset>
  );
}

function VedFields() {
  return (
    <fieldset className="grid gap-3 rounded-xl border border-line bg-sand/60 p-3.5">
      <legend className="px-1 text-xs font-semibold text-muted">Ved-konfigurasjon</legend>
      <label className={label}>
        Modell *
        <select name="ved_modell" defaultValue="Medium" className={`${input} mt-1`}>
          <option value="Medium">Medium</option>
          <option value="Stor">Stor</option>
        </select>
      </label>
    </fieldset>
  );
}

function OrdenFields() {
  return (
    <fieldset className="grid gap-3 rounded-xl border border-line bg-sand/60 p-3.5">
      <legend className="px-1 text-xs font-semibold text-muted">Orden-konfigurasjon</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className={label}>
          Kassetype *
          <select name="orden_bt" defaultValue="60L" className={`${input} mt-1`}>
            <option value="60L">60L</option>
            <option value="100L">100L</option>
          </select>
        </label>
        <label className={label}>
          Bredde (kasser) *
          <select name="orden_w" defaultValue="3" className={`${input} mt-1`}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className={label}>
          Høyde (kasser) *
          <select name="orden_h" defaultValue="4" className={`${input} mt-1`}>
            {[3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      <label className="flex min-h-[44px] items-center gap-2.5 text-[15px]"><input type="checkbox" name="orden_hjul" /> Hjul</label>
    </fieldset>
  );
}

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

      {site === 'skjul' ? <SkjulFields /> : null}
      {site === 'ved' ? <VedFields /> : null}
      {site === 'orden' ? <OrdenFields /> : null}

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
