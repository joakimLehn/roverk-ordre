import { BUILD_STATUSES, BUILD_STATUS_LABELS } from '@/lib/status';

export interface FilterParams extends Record<string, string | undefined> {
  q?: string;
  produkt?: string;
  status?: string;
  faktura?: string;
  vis_test?: string;
  view?: string;
}

function hasActiveFilters(p: FilterParams): boolean {
  return Boolean(p.q || p.produkt || p.status || p.faktura || p.vis_test);
}

// Detaljfiltrene brukes sjelden på mobil, så de ligger sammenslått bak
// «Filtrer og søk». <details> gjør at det virker uten klient-JS.
export function Filters({ params }: { params: FilterParams }) {
  const sel = 'min-h-[42px] rounded-lg border border-line bg-white px-2.5 text-[13px]';
  return (
    <details open={hasActiveFilters(params)} className="mb-3.5 rounded-xl border border-line bg-white sm:border-0 sm:bg-transparent">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 px-3.5 text-[13.5px] font-semibold text-muted sm:hidden">
        <span>⌕</span> Filtrer og søk
        {hasActiveFilters(params) ? <span className="ml-auto text-brand">aktivt</span> : null}
      </summary>
      <form method="get" className="flex flex-col gap-2.5 p-3.5 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:p-0">
        {params.view ? <input type="hidden" name="view" value={params.view} /> : null}
        <input
          type="search"
          name="q"
          defaultValue={params.q ?? ''}
          placeholder="Søk på navn, e-post, telefon …"
          className="min-h-[42px] w-full rounded-lg border border-line bg-white px-3 text-sm sm:w-auto sm:min-w-[180px] sm:flex-1"
        />
        <div className="grid grid-cols-2 gap-2.5 sm:contents">
          <select name="produkt" defaultValue={params.produkt ?? ''} className={sel}>
            <option value="">Alle produkter</option>
            <option value="skjul">Skjul</option>
            <option value="ved">Ved</option>
            <option value="orden">Orden</option>
          </select>
          <select name="status" defaultValue={params.status ?? ''} className={sel}>
            <option value="">Alle statuser</option>
            {BUILD_STATUSES.map((s) => (
              <option key={s} value={s}>{BUILD_STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select name="faktura" defaultValue={params.faktura ?? ''} className={`${sel} col-span-2 sm:col-auto`}>
            <option value="">Faktura: alle</option>
            <option value="ikke_fakturert">Ikke fakturert</option>
            <option value="fakturert">Fakturert, ikke betalt</option>
            <option value="betalt">Betalt</option>
          </select>
        </div>
        <label className="flex min-h-[42px] items-center gap-2 text-[13px] text-muted">
          <input type="checkbox" name="vis_test" value="1" defaultChecked={params.vis_test === '1'} />
          Vis testordrer
        </label>
        <button className="min-h-[44px] cursor-pointer rounded-lg border border-line bg-white px-3.5 text-[13px] font-semibold">
          Bruk filter
        </button>
      </form>
    </details>
  );
}
