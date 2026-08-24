'use client';

import { useState, useTransition } from 'react';
import type { Inspection } from '@/lib/inspection';
import { INSPECTION_PRODUCTS, INSPECTION_PRODUCT_LABELS } from '@/lib/inspection';
import { KANALER } from '@/lib/manual-order';
import { saveInspectionCustomer } from '@/app/befaringer/[id]/actions';

export function InspectionCustomerForm({ inspection }: { inspection: Inspection }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | undefined>();

  if (!editing) {
    return (
      <div className="grid grid-cols-[110px_1fr] gap-y-1 text-[13.5px]">
        <span className="text-muted">Navn</span><span>{inspection.name}</span>
        <span className="text-muted">Telefon</span>
        {inspection.phone ? (
          <a href={`tel:${inspection.phone}`} className="underline-offset-2 hover:underline">{inspection.phone}</a>
        ) : (
          <span>–</span>
        )}
        <span className="text-muted">E-post</span>
        {inspection.email ? (
          <a href={`mailto:${inspection.email}`} className="underline-offset-2 hover:underline">{inspection.email}</a>
        ) : (
          <span>–</span>
        )}
        <span className="text-muted">Adresse</span><span>{inspection.address ?? '–'}</span>
        <span className="text-muted">Produkt</span>
        <span>{inspection.product ? INSPECTION_PRODUCT_LABELS[inspection.product] : '–'}</span>
        <span className="text-muted">Kanal</span><span>{inspection.channel ?? '–'}</span>
        <button
          onClick={() => setEditing(true)}
          className="col-span-2 mt-1 flex min-h-[40px] w-fit cursor-pointer items-center text-[13.5px] font-semibold text-brand"
        >
          Rediger kundeinfo
        </button>
      </div>
    );
  }

  const input = 'min-h-[46px] w-full rounded-lg border border-line bg-white px-3 py-2 text-base md:text-sm';
  return (
    <form
      action={(fd) => start(async () => {
        const r = await saveInspectionCustomer(inspection.id, fd);
        if (r.message) {
          setMessage(r.message);
          return;
        }
        setMessage(undefined);
        setEditing(false);
      })}
      className="grid gap-2 text-sm"
    >
      <input name="name" defaultValue={inspection.name} placeholder="Navn" required className={input} />
      <input name="phone" defaultValue={inspection.phone ?? ''} placeholder="Telefon" className={input} />
      <input name="email" type="email" defaultValue={inspection.email ?? ''} placeholder="E-post" className={input} />
      <input name="address" defaultValue={inspection.address ?? ''} placeholder="Adresse" className={input} />
      <label className="text-xs text-muted">
        Produkt
        <select name="product" defaultValue={inspection.product ?? ''} className={`${input} mt-1`}>
          <option value="">Velg …</option>
          {INSPECTION_PRODUCTS.map((p) => (
            <option key={p} value={p}>{INSPECTION_PRODUCT_LABELS[p]}</option>
          ))}
        </select>
      </label>
      <label className="text-xs text-muted">
        Kanal
        <select name="kanal" defaultValue={inspection.channel ?? ''} className={`${input} mt-1`}>
          <option value="">Velg …</option>
          {KANALER.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </label>
      {message ? <p className="text-sm font-semibold text-danger">{message}</p> : null}
      <div className="flex gap-2">
        <button
          disabled={pending}
          className="min-h-[46px] flex-1 cursor-pointer rounded-lg bg-brand px-3.5 text-[14.5px] font-bold text-white disabled:opacity-60 md:min-h-0 md:flex-none md:py-2 md:text-[13px] md:font-semibold"
        >
          {pending ? 'Lagrer …' : 'Lagre'}
        </button>
        <button
          type="button"
          onClick={() => { setEditing(false); setMessage(undefined); }}
          className="min-h-[46px] flex-1 cursor-pointer rounded-lg border border-line bg-white px-3.5 text-[14.5px] font-semibold md:min-h-0 md:flex-none md:py-2 md:text-[13px] md:font-normal"
        >
          Avbryt
        </button>
      </div>
    </form>
  );
}
