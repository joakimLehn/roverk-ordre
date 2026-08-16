import type { Kpis } from '@/lib/kpi';
import { formatPrice } from '@/lib/format';

// Mobil: kompakt stripe som dras sidelengs. Skrivebord: full rutenett-rad.
export function KpiRow({ kpis }: { kpis: Kpis }) {
  const cards = [
    { n: String(kpis.nye), t: 'Nye', tLong: 'Nye ordrer', hot: true },
    { n: String(kpis.underBygging), t: 'Under bygging', tLong: 'Under bygging', hot: false },
    { n: String(kpis.montertIkkeFakturert), t: 'Å fakturere', tLong: 'Montert, ikke fakturert', hot: false },
    { n: formatPrice(kpis.utestaaendeNok), t: 'Utestående', tLong: 'Utestående (fakturert, ikke betalt)', hot: false },
    { n: formatPrice(kpis.totalNok), t: 'Totalt', tLong: 'Totalt ordrebeløp', hot: false },
  ];
  return (
    <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:mb-4 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
      {cards.map((c) => (
        <div
          key={c.tLong}
          className="min-w-[112px] flex-none rounded-xl border border-line bg-white px-3 py-2.5 sm:min-w-0 sm:px-3.5 sm:py-3"
        >
          <div className={`text-[19px] font-extrabold tabular-nums sm:text-2xl ${c.hot ? 'text-brand' : ''}`}>
            {c.n}
          </div>
          <div className="text-[11px] text-muted sm:hidden">{c.t}</div>
          <div className="hidden text-xs text-muted sm:block">{c.tLong}</div>
        </div>
      ))}
    </div>
  );
}
