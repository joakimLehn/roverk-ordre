'use client';

// Mobilvisning av en ordre. Erstatter tabellrader under sm-breakpoint:
// all info på ett kort, og status/faktura endres direkte på kortet.
import Link from 'next/link';
import { useState, useTransition } from 'react';
import type { Order } from '@/lib/types';
import { BUILD_STATUS_LABELS } from '@/lib/status';
import { formatDateNo, formatPrice, materialLabel, siteLabel } from '@/lib/format';
import { setInvoiced, setPaid } from '@/app/ordre/[id]/actions';
import { StatusSheet } from './StatusSheet';

const STATUS_STYLES: Record<string, string> = {
  ny: 'bg-warn-bg text-warn',
  under_bygging: 'bg-info-bg text-info',
  bygd: 'bg-sand text-ink',
  montert: 'bg-ok-bg text-ok',
};

function Box({ on }: { on: boolean }) {
  return (
    <span
      className={`flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border-[1.5px] text-[11px] text-white ${
        on ? 'border-ok bg-ok' : 'border-muted'
      }`}
    >
      {on ? '✓' : ''}
    </span>
  );
}

export function OrderCard({ order: o }: { order: Order }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pending, start] = useTransition();

  const title = `${siteLabel(o.site)}${o.product ? ` – ${o.product}` : ''}`;
  const details = [materialLabel(o.config), o.planned_build_date ? `bygges ${formatDateNo(o.planned_build_date)}` : null]
    .filter(Boolean)
    .join(' · ');
  const sted = o.address_meta?.poststed ? ` · ${String(o.address_meta.poststed)}` : '';

  return (
    <>
      <div className={`overflow-hidden rounded-2xl border border-line bg-white ${o.is_test ? 'opacity-50' : ''}`}>
        <Link href={`/ordre/${o.id}`} className="flex gap-3 px-3.5 pb-2.5 pt-3.5">
          <div className="min-w-0 flex-1">
            <div className="text-[15.5px] font-bold leading-tight">
              {title}
              {o.is_test ? (
                <span className="ml-1.5 rounded-[5px] bg-danger-bg px-1.5 py-px text-[10.5px] font-extrabold text-danger">
                  TEST
                </span>
              ) : null}
            </div>
            {details ? <div className="mt-0.5 text-[13px] text-muted">{details}</div> : null}
            <div className="mt-1.5 text-[13.5px]">{o.name}{sted}</div>
          </div>
          <div className="text-right">
            <div className="text-[15px] font-bold tabular-nums whitespace-nowrap">{formatPrice(o.price_nok)}</div>
            <div className="mt-0.5 text-[11.5px] text-muted whitespace-nowrap">{formatDateNo(o.created_at)}</div>
          </div>
        </Link>

        {o.is_test ? null : (
          <div className="flex border-t border-line">
            <button
              onClick={() => setSheetOpen(true)}
              className={`flex min-h-[46px] flex-1 items-center justify-center gap-1.5 border-r border-line text-[13.5px] font-bold ${STATUS_STYLES[o.build_status]}`}
            >
              {BUILD_STATUS_LABELS[o.build_status]}
              <span className="text-[10px] opacity-60">▾</span>
            </button>
            <button
              disabled={pending}
              onClick={() => start(() => setInvoiced(o.id, !o.invoiced_at))}
              className={`flex min-h-[46px] flex-1 items-center justify-center gap-1.5 border-r border-line text-[13.5px] font-bold disabled:opacity-60 ${
                o.invoiced_at ? 'text-ok' : 'text-muted'
              }`}
            >
              <Box on={!!o.invoiced_at} /> Fakturert
            </button>
            <button
              disabled={pending}
              onClick={() => start(() => setPaid(o.id, !o.paid_at))}
              className={`flex min-h-[46px] flex-1 items-center justify-center gap-1.5 text-[13.5px] font-bold disabled:opacity-60 ${
                o.paid_at ? 'text-ok' : 'text-muted'
              }`}
            >
              <Box on={!!o.paid_at} /> Betalt
            </button>
          </div>
        )}
      </div>

      {sheetOpen ? (
        <StatusSheet
          orderId={o.id}
          current={o.build_status}
          title={`${title} · ${o.name}`}
          onClose={() => setSheetOpen(false)}
        />
      ) : null}
    </>
  );
}
