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

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3 5.5h14M6 10h8M8.5 14.5h3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
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
    /* Én rad på mobil: søket tar plassen, filtrene er en kompakt knapp ved
       siden. To fullbreddes rader spiste ~60 px av det bunnlinja frigjorde. */
    <div
      className={`mb-2.5 flex items-start gap-2 md:mb-3.5 md:flex-wrap ${
        pending ? 'opacity-70' : ''
      }`}
    >
      <form method="get" className="relative min-w-0 flex-1 md:min-w-[220px]">
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

      <details open={hasDetailFilters(params)} className="relative flex-none">
        <summary
          aria-label="Flere filtre"
          className="focus-ring flex min-h-[44px] cursor-pointer list-none items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[13.5px] font-semibold text-muted md:min-h-[42px]"
        >
          <FilterIcon />
          <span className="hidden md:inline">Flere filtre</span>
          {hasDetailFilters(params) ? (
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-label="filter aktivt" />
          ) : null}
        </summary>
        <form
          method="get"
          className="absolute right-0 z-30 mt-1.5 flex w-[min(88vw,300px)] flex-col gap-2.5 rounded-xl border border-line bg-white p-3.5 shadow-lg"
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
