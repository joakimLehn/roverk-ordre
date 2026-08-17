'use client';

import { useState, useTransition } from 'react';
import type { Order } from '@/lib/types';
import { saveBestilling } from '@/app/ordre/[id]/actions';
import { configEntries, siteLabel } from '@/lib/format';
import { KANALER } from '@/lib/manual-order';
import { bestillingFormDefaults } from '@/lib/edit-order';
import { ProductConfigFields } from '@/components/ProductConfigFields';

const input = 'min-h-[46px] w-full rounded-lg border border-line bg-white px-3 py-2 text-base sm:text-sm';
const label = 'block text-xs font-semibold text-muted';

export function BestillingForm({ order }: { order: Order }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const cfg = configEntries(order.config);
  const defaults = bestillingFormDefaults(order.site, order.config);
  const manuell = order.config.manuell === true;
  const kanal = typeof order.config.kanal === 'string' ? order.config.kanal : '';
  const kanalDefault = (KANALER as readonly string[]).includes(kanal) ? kanal : 'E-post';

  if (!editing) {
    return (
      <div>
        {cfg.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-line bg-white">
            {cfg.map((r) => (
              <div
                key={r.key}
                className="flex justify-between gap-4 border-b border-line px-3.5 py-2.5 text-sm last:border-b-0"
              >
                <span className="text-muted">{r.key}</span>
                <span className="text-right font-semibold">{r.value}</span>
              </div>
            ))}
          </div>
        ) : null}
        {defaults ? (
          <button
            type="button"
            onClick={() => { setError(null); setEditing(true); }}
            className="mt-1 flex min-h-[46px] w-fit cursor-pointer items-center text-[13.5px] font-semibold text-brand"
          >
            Rediger bestilling
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <form
      action={(fd) => start(async () => {
        const result = await saveBestilling(order.id, fd);
        if (result.message) {
          setError(result.message);
          return;
        }
        setError(null);
        setEditing(false);
      })}
      className="grid gap-3.5"
    >
      <div>
        <span className={label}>Produkt</span>
        <p className="mt-1 flex min-h-[46px] items-center text-base font-semibold sm:text-sm">
          {siteLabel(order.site)}
        </p>
      </div>

      <ProductConfigFields site={order.site} defaults={defaults ?? undefined} />

      <label className={label}>
        Pris (kr)
        <input
          name="price_nok"
          inputMode="numeric"
          defaultValue={order.price_nok ?? ''}
          placeholder="64 900"
          className={`${input} mt-1`}
        />
      </label>

      {manuell ? (
        <label className={label}>
          Kanal
          <select name="kanal" defaultValue={kanalDefault} className={`${input} mt-1`}>
            {KANALER.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
      ) : null}

      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}

      <div className="flex gap-2">
        <button
          disabled={pending}
          className="min-h-[46px] flex-1 cursor-pointer rounded-lg bg-brand px-3.5 text-[14.5px] font-bold text-white disabled:opacity-60 sm:min-h-0 sm:flex-none sm:py-2 sm:text-[13px] sm:font-semibold"
        >
          {pending ? 'Lagrer …' : 'Lagre'}
        </button>
        <button
          type="button"
          onClick={() => { setError(null); setEditing(false); }}
          className="min-h-[46px] flex-1 cursor-pointer rounded-lg border border-line bg-white px-3.5 text-[14.5px] font-semibold sm:min-h-0 sm:flex-none sm:py-2 sm:text-[13px] sm:font-normal"
        >
          Avbryt
        </button>
      </div>
    </form>
  );
}
