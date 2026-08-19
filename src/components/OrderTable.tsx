'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import type { Order } from '@/lib/types';
import { TestBadge } from './Badge';
import { StatusSelect } from './InlineControls';
import { MoneyChip } from './MoneyChip';
import { useToast } from './Toast';
import { SAVE_ERROR } from './useOptimisticField';
import { setInvoicedBulk } from '@/app/ordre/[id]/actions';
import { ageInDays, isStale } from '@/lib/age';
import { SORT_COLUMNS, parseSort, toggleSort, type SortKey } from '@/lib/sort';
import { listHref } from '@/lib/views';
import { formatDateNo, formatPrice, materialLabel, siteLabel } from '@/lib/format';

const td = 'border-b border-line px-3 py-2.5';

/** Panelet vises fra lg; under det er detaljene en egen side. */
const PANEL_QUERY = '(min-width: 1024px)';

function SortArrow({ desc }: { desc: boolean }) {
  return (
    <span aria-hidden="true" className="ml-1 inline-block text-[9px]">
      {desc ? '▼' : '▲'}
    </span>
  );
}

export function OrderTable({
  orders,
  now,
  params,
}: {
  orders: Order[];
  now: string;
  /* Listetilstanden kommer som et vanlig objekt, ikke som href-byggere:
     funksjoner kan ikke krysse grensa til en klientkomponent. Lenkene bygges
     her med listHref, som er ren og importerbar på begge sider. */
  params: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const toast = useToast();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [bulkPending, startBulk] = useTransition();
  const [cursor, setCursor] = useState<number>(-1);
  const sort = params.sort;
  const selectedId = params.valgt;
  const active = parseSort(sort);
  const bodyRef = useRef<HTMLTableSectionElement>(null);

  const ids = useMemo(() => orders.map((o) => o.id), [orders]);

  // Valg som ikke lenger finnes i lista (filter endret, ordre fakturert)
  // skal ikke henge igjen i bunkelinja.
  useEffect(() => {
    setPicked((prev) => {
      const next = new Set([...prev].filter((id) => ids.includes(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [ids]);

  const open = useCallback(
    (id: string) => {
      // På brede skjermer fyller raden sidepanelet og lista står. Ellers er
      // detaljene en egen side – som også er det som skjer uten JS.
      if (window.matchMedia(PANEL_QUERY).matches) {
        router.replace(listHref(params, { valgt: id }), { scroll: false });
      } else {
        router.push(`/ordre/${id}`);
      }
    },
    [router, params],
  );

  // Tastatur: dette er en app noen bruker hver dag.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const typing =
        el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '/' && !typing) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
        return;
      }
      if (typing) return;

      if (e.key === 'j' || e.key === 'k') {
        e.preventDefault();
        setCursor((c) => {
          const next = e.key === 'j' ? Math.min(orders.length - 1, c + 1) : Math.max(0, c - 1);
          bodyRef.current?.querySelectorAll('tr')[next]?.scrollIntoView({ block: 'nearest' });
          return next;
        });
        return;
      }
      if (e.key === 'Enter' && cursor >= 0 && orders[cursor]) {
        e.preventDefault();
        open(orders[cursor].id);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [orders, cursor, open]);

  if (orders.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-white p-8 text-center text-sm text-muted">
        Ingen ordrer matcher filteret.
      </p>
    );
  }

  const pickable = orders.filter((o) => !o.is_test && !o.invoiced_at);
  const allPicked = pickable.length > 0 && pickable.every((o) => picked.has(o.id));

  function toggleAll() {
    setPicked(allPicked ? new Set() : new Set(pickable.map((o) => o.id)));
  }

  function togglePicked(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function invoiceBulk() {
    const batch = [...picked];
    if (batch.length === 0) return;
    startBulk(async () => {
      let changed: number;
      try {
        changed = await setInvoicedBulk(batch, true);
      } catch {
        toast.showError(SAVE_ERROR);
        return;
      }
      setPicked(new Set());
      toast.show({
        message:
          changed === 1
            ? '1 ordre markert som fakturert'
            : `${changed} ordrer markert som fakturert`,
        undo: async () => {
          await setInvoicedBulk(batch, false);
        },
      });
    });
  }

  return (
    <>
      {picked.size > 0 ? (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl bg-ink px-3.5 py-2.5 text-[13px] text-white">
          <strong className="tabular-nums">
            {picked.size} {picked.size === 1 ? 'ordre' : 'ordrer'} valgt
          </strong>
          <button
            onClick={invoiceBulk}
            disabled={bulkPending}
            className="focus-ring cursor-pointer rounded-lg bg-brand px-3 py-1.5 text-[12.5px] font-bold disabled:opacity-60"
          >
            {bulkPending ? 'Markerer …' : 'Marker som fakturert'}
          </button>
          <button
            onClick={() => setPicked(new Set())}
            className="focus-ring cursor-pointer rounded-lg border border-white/25 px-3 py-1.5 text-[12.5px] font-semibold"
          >
            Avbryt
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full border-collapse text-sm text-ink">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted">
              <th scope="col" className="w-9 border-b border-line px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={allPicked}
                  onChange={toggleAll}
                  disabled={pickable.length === 0}
                  aria-label="Velg alle ufakturerte ordrer i lista"
                  className="focus-ring h-4 w-4 accent-brand"
                />
              </th>
              <SortableHeader column="alder" active={active} params={params} />
              <th scope="col" className="border-b border-line px-3 py-2.5 font-semibold">Produkt</th>
              <SortableHeader column="kunde" active={active} params={params} />
              <SortableHeader column="pris" active={active} params={params} />
              <th scope="col" className="border-b border-line px-3 py-2.5 font-semibold">Byggstatus</th>
              <th scope="col" className="border-b border-line px-3 py-2.5 font-semibold">Faktura</th>
              <SortableHeader column="byggedato" active={active} params={params} />
            </tr>
          </thead>
          <tbody ref={bodyRef}>
            {orders.map((o, i) => {
              const days = ageInDays(o.created_at, now);
              const stale = isStale(o.build_status, days);
              const variant = materialLabel(o.config);
              const isSelected = o.id === selectedId;
              return (
                /* Hele raden er klikkflaten. Produkt-cellen har en ekte lenke i
                   tillegg, så tastatur og skjermleser når fram uten museklikk. */
                <tr
                  key={o.id}
                  onClick={() => open(o.id)}
                  aria-selected={isSelected}
                  className={`cursor-pointer ${
                    isSelected
                      ? 'bg-brand/8 shadow-[inset_3px_0_0_var(--color-brand)]'
                      : i === cursor
                        ? 'bg-sand shadow-[inset_3px_0_0_var(--color-line)]'
                        : o.is_test
                          ? 'bg-danger-bg/25 hover:bg-danger-bg/40'
                          : 'hover:bg-sand'
                  }`}
                >
                  <td className={td} onClick={(e) => e.stopPropagation()}>
                    {o.is_test || o.invoiced_at ? null : (
                      <input
                        type="checkbox"
                        checked={picked.has(o.id)}
                        onChange={() => togglePicked(o.id)}
                        aria-label={`Velg ordren til ${o.name}`}
                        className="focus-ring h-4 w-4 accent-brand"
                      />
                    )}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[11.5px] font-semibold tabular-nums ${
                        stale ? 'bg-danger-bg text-danger' : 'bg-sand text-muted'
                      }`}
                      title={`Mottatt ${formatDateNo(o.created_at)}`}
                    >
                      {days} d
                    </span>
                  </td>
                  <td className={`${td} font-semibold`}>
                    <Link
                      href={`/ordre/${o.id}`}
                      className="focus-ring block"
                      onClick={(e) => {
                        // Panelet skal brukes når det finnes; lenka er
                        // fallback for tastatur uten JS og for nytt fane-klikk.
                        if (window.matchMedia(PANEL_QUERY).matches && !e.metaKey && !e.ctrlKey) {
                          e.preventDefault();
                          e.stopPropagation();
                          open(o.id);
                        }
                      }}
                    >
                      {siteLabel(o.site)}{o.product ? ` – ${o.product}` : ''}
                      {variant ? <span className="block text-xs font-normal text-muted">{variant}</span> : null}
                    </Link>
                  </td>
                  <td className={td}>
                    {o.name}
                    {o.address_meta?.poststed ? (
                      <span className="block text-xs text-muted">{String(o.address_meta.poststed)}</span>
                    ) : null}
                  </td>
                  <td className={`${td} whitespace-nowrap tabular-nums`}>{formatPrice(o.price_nok)}</td>
                  <td className={td}>
                    {o.is_test ? (
                      <TestBadge />
                    ) : (
                      <StatusSelect orderId={o.id} kunde={o.name} current={o.build_status} />
                    )}
                  </td>
                  <td className={td}>
                    {o.is_test ? null : (
                      <MoneyChip
                        orderId={o.id}
                        kunde={o.name}
                        invoiced={!!o.invoiced_at}
                        paid={!!o.paid_at}
                        className="w-[124px]"
                      />
                    )}
                  </td>
                  <td className={`${td} whitespace-nowrap text-xs`}>{formatDateNo(o.planned_build_date)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SortableHeader({
  column,
  active,
  params,
}: {
  column: SortKey;
  active: { key: SortKey; desc: boolean };
  params: Record<string, string | undefined>;
}) {
  const col = SORT_COLUMNS.find((c) => c.key === column)!;
  const on = active.key === column;
  return (
    <th
      scope="col"
      aria-sort={on ? (active.desc ? 'descending' : 'ascending') : 'none'}
      className="border-b border-line px-3 py-2.5 font-semibold"
    >
      <Link
        href={listHref(params, { sort: toggleSort(params.sort, column) })}
        scroll={false}
        className={`focus-ring inline-flex items-center whitespace-nowrap ${on ? 'text-ink' : 'hover:text-ink'}`}
      >
        {col.label}
        {on ? <SortArrow desc={active.desc} /> : null}
      </Link>
    </th>
  );
}
