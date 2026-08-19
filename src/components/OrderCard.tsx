'use client';

// Mobilvisning av en ordre. Erstatter tabellrader under md-breakpunktet:
// all info på ett kort, og status/penger endres direkte på kortet.
import Link from 'next/link';
import { useState } from 'react';
import type { BuildStatus, Order } from '@/lib/types';
import { BUILD_STATUS_LABELS } from '@/lib/status';
import { ageInDays, isStale } from '@/lib/age';
import { formatDateNo, formatPrice, materialLabel, siteLabel } from '@/lib/format';
import { setBuildStatus } from '@/app/ordre/[id]/actions';
import { MoneyChip } from './MoneyChip';
import { StatusSheet } from './StatusSheet';
import { useOptimisticField } from './useOptimisticField';

const STATUS_STYLES: Record<BuildStatus, string> = {
  ny: 'bg-warn-bg text-warn',
  under_bygging: 'bg-info-bg text-info',
  bygd: 'bg-sand text-ink',
  montert: 'bg-ok-bg text-ok',
};

export function OrderCard({ order: o, now }: { order: Order; now: string }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const status = useOptimisticField(o.build_status);

  const title = `${siteLabel(o.site)}${o.product ? ` – ${o.product}` : ''}`;
  const sted = o.address_meta?.poststed ? ` · ${String(o.address_meta.poststed)}` : '';
  const variant = materialLabel(o.config);
  const days = ageInDays(o.created_at, now);
  const stale = isStale(o.build_status, days);

  function choose(next: BuildStatus) {
    const prev = status.value;
    status.run(next, {
      action: () => setBuildStatus(o.id, next),
      message: `${o.name} · ${BUILD_STATUS_LABELS[next].toLowerCase()}`,
      undo: () => setBuildStatus(o.id, prev),
    });
  }

  return (
    <>
      <div
        className={`overflow-hidden rounded-2xl border bg-white ${
          o.is_test ? 'border-dashed border-danger/45' : 'border-line'
        }`}
      >
        <Link href={`/ordre/${o.id}`} className="focus-ring flex gap-3 px-3.5 pb-2.5 pt-3.5 active:bg-sand">
          <div className="min-w-0 flex-1">
            <div className="text-[15.5px] font-bold leading-tight">
              {title}
              {o.is_test ? (
                <span className="ml-1.5 rounded-[5px] bg-danger-bg px-1.5 py-px text-[11px] font-extrabold text-danger">
                  TEST
                </span>
              ) : null}
            </div>
            <div className="mt-1 text-[13.5px]">
              {o.name}
              {sted}
            </div>
            {variant ? <div className="mt-0.5 text-[13px] text-muted">{variant}</div> : null}
          </div>
          <div className="text-right">
            <div className="whitespace-nowrap text-[15px] font-bold tabular-nums">
              {formatPrice(o.price_nok)}
            </div>
            <div
              className={`mt-0.5 whitespace-nowrap text-[11.5px] ${
                stale ? 'font-bold text-danger' : 'text-muted'
              }`}
            >
              {stale ? `${days} d gammel` : `mottatt ${formatDateNo(o.created_at)}`}
            </div>
          </div>
        </Link>

        {o.is_test ? null : (
          <div className="flex gap-2 px-3.5 pb-3">
            <button
              onClick={() => setSheetOpen(true)}
              className={`focus-ring flex min-h-[38px] flex-[1.15] cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-line text-[12.5px] font-bold ${STATUS_STYLES[status.value]}`}
            >
              {BUILD_STATUS_LABELS[status.value]}
              <svg width="8" height="6" viewBox="0 0 10 7" fill="none" aria-hidden="true" className="opacity-55">
                <path d="M1 1.5L5 5.5L9 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <MoneyChip
              orderId={o.id}
              kunde={o.name}
              invoiced={!!o.invoiced_at}
              paid={!!o.paid_at}
              className="flex-1"
            />
          </div>
        )}
      </div>

      {sheetOpen ? (
        <StatusSheet
          current={status.value}
          title={`${title} · ${o.name}`}
          onChoose={choose}
          onClose={() => setSheetOpen(false)}
        />
      ) : null}
    </>
  );
}
