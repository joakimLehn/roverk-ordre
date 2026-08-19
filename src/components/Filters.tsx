'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { BUILD_STATUSES, BUILD_STATUS_LABELS } from '@/lib/status';
import { listHref } from '@/lib/views';

export interface FilterParams extends Record<string, string | undefined> {
  q?: string;
  produkt?: string;
  status?: string;
  faktura?: string;
  vis_test?: string;
  view?: string;
  valgt?: string;
  sort?: string;
}

function hasDetailFilters(p: FilterParams): boolean {
  return Boolean(p.produkt || p.status || p.faktura || p.vis_test);
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="8.7" cy="8.7" r="5.6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Søk står alltid framme – det er den raskeste veien til «den ordren til
 * Kvam». Detaljfiltrene brukes sjelden på mobil og ligger sammenslått bak
 * «Flere filtre».
 *
 * Nedtrekkene sendes inn ved endring, så et filterbytte er umiddelbart i
 * stedet for et ekstra klikk på «Bruk filter». Skjemaene og knappen står
 * likevel igjen: uten JS er de det som virker, og de er ekte GET-skjemaer.
 */
export function Filters({ params }: { params: FilterParams }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  // Et filterbytte gir en ny liste, så ordren i sidepanelet slippes.
  function patch(next: Partial<FilterParams>) {
    start(() => {
      router.replace(listHref(params, { ...next, valgt: undefined }), { scroll: false });
    });
  }

  const sel = 'focus-ring min-h-[42px] rounded-lg border border-line bg-white px-2.5 text-[13px]';
  const keep = (
    <>
      {params.view ? <input type="hidden" name="view" value={params.view} /> : null}
      {params.sort ? <input type="hidden" name="sort" value={params.sort} /> : null}
    </>
  );

  return (
    <div
      className={`mb-3.5 flex flex-col gap-2.5 md:flex-row md:flex-wrap md:items-start ${
        pending ? 'opacity-70' : ''
      }`}
    >
      <form method="get" className="relative flex-1 md:min-w-[220px]">
        {keep}
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <SearchIcon />
        </span>
        <input
          type="search"
          name="q"
          defaultValue={params.q ?? ''}
          aria-label="Søk i ordrer"
          placeholder="Navn, e-post, telefon …"
          className="focus-ring min-h-[44px] w-full rounded-lg border border-line bg-white pl-9 pr-3 text-base md:min-h-[42px] md:text-sm"
        />
      </form>

      <details
        open={hasDetailFilters(params)}
        className="rounded-xl border border-line bg-white md:relative md:rounded-none md:border-0 md:bg-transparent"
      >
        <summary className="focus-ring flex min-h-[44px] cursor-pointer list-none items-center gap-2 rounded-xl px-3.5 text-[13.5px] font-semibold text-muted md:min-h-[42px] md:rounded-lg md:border md:border-line md:bg-white md:px-3">
          Flere filtre
          {hasDetailFilters(params) ? <span className="ml-auto text-brand md:ml-1.5">aktivt</span> : null}
        </summary>
        <form
          method="get"
          className="flex flex-col gap-2.5 p-3.5 pt-1 md:absolute md:z-30 md:mt-1.5 md:w-[280px] md:rounded-xl md:border md:border-line md:bg-white md:p-3.5 md:shadow-lg"
        >
          {keep}
          {params.q ? <input type="hidden" name="q" value={params.q} /> : null}
          <div className="grid grid-cols-2 gap-2.5">
            <select
              name="produkt"
              value={params.produkt ?? ''}
              onChange={(e) => patch({ produkt: e.target.value })}
              aria-label="Produkt"
              className={sel}
            >
              <option value="">Alle produkter</option>
              <option value="skjul">Skjul</option>
              <option value="ved">Ved</option>
              <option value="orden">Orden</option>
            </select>
            <select
              name="status"
              value={params.status ?? ''}
              onChange={(e) => patch({ status: e.target.value })}
              aria-label="Byggstatus"
              className={sel}
            >
              <option value="">Alle statuser</option>
              {BUILD_STATUSES.map((s) => (
                <option key={s} value={s}>{BUILD_STATUS_LABELS[s]}</option>
              ))}
            </select>
            <select
              name="faktura"
              value={params.faktura ?? ''}
              onChange={(e) => patch({ faktura: e.target.value })}
              aria-label="Fakturastatus"
              className={`${sel} col-span-2`}
            >
              <option value="">Faktura: alle</option>
              <option value="ikke_fakturert">Ikke fakturert</option>
              <option value="fakturert">Fakturert, ikke betalt</option>
              <option value="betalt">Betalt</option>
            </select>
          </div>
          <label className="flex min-h-[42px] items-center gap-2 text-[13px] text-muted">
            <input
              type="checkbox"
              name="vis_test"
              value="1"
              checked={params.vis_test === '1'}
              onChange={(e) => patch({ vis_test: e.target.checked ? '1' : undefined })}
              className="focus-ring h-4 w-4 accent-brand"
            />
            Vis testordrer
          </label>
          {/* Fallback uten JS – med JS har filtrene alt sendt seg inn. */}
          <noscript>
            <button className="min-h-[44px] w-full cursor-pointer rounded-lg bg-ink px-3.5 text-[13px] font-semibold text-white">
              Bruk filter
            </button>
          </noscript>
          {hasDetailFilters(params) ? (
            <button
              type="button"
              onClick={() =>
                patch({ produkt: undefined, status: undefined, faktura: undefined, vis_test: undefined })
              }
              className="focus-ring min-h-[44px] cursor-pointer rounded-lg border border-line px-3.5 text-[13px] font-semibold"
            >
              Nullstill filtrene
            </button>
          ) : null}
        </form>
      </details>
    </div>
  );
}
