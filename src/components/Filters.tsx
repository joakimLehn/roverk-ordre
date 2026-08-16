import { BUILD_STATUSES, BUILD_STATUS_LABELS } from '@/lib/status';

export interface FilterParams {
  q?: string;
  produkt?: string;
  status?: string;
  faktura?: string;
  vis_test?: string;
}

export function Filters({ params }: { params: FilterParams }) {
  const sel = 'rounded-lg border border-line bg-white px-2.5 py-2 text-[13px]';
  return (
    <form method="get" className="mb-3.5 flex flex-wrap items-center gap-2.5">
      <input
        type="search"
        name="q"
        defaultValue={params.q ?? ''}
        placeholder="Søk på navn, e-post, telefon …"
        className="min-w-[180px] flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm"
      />
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
      <select name="faktura" defaultValue={params.faktura ?? ''} className={sel}>
        <option value="">Faktura: alle</option>
        <option value="ikke_fakturert">Ikke fakturert</option>
        <option value="fakturert">Fakturert, ikke betalt</option>
        <option value="betalt">Betalt</option>
      </select>
      <label className="flex items-center gap-1.5 text-[13px] text-muted">
        <input type="checkbox" name="vis_test" value="1" defaultChecked={params.vis_test === '1'} />
        Vis testordrer
      </label>
      <button className="cursor-pointer rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-semibold">
        Filtrer
      </button>
    </form>
  );
}
