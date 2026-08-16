import type { Kpis } from '@/lib/kpi';
import { formatPrice } from '@/lib/format';

export function KpiRow({ kpis }: { kpis: Kpis }) {
  const cards = [
    { n: String(kpis.nye), t: 'Nye ordrer', hot: true },
    { n: String(kpis.underBygging), t: 'Under bygging', hot: false },
    { n: String(kpis.montertIkkeFakturert), t: 'Montert, ikke fakturert', hot: false },
    { n: formatPrice(kpis.utestaaendeNok), t: 'Utestående (fakturert, ikke betalt)', hot: false },
  ];
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.t} className="rounded-xl border border-line bg-white px-3.5 py-3">
          <div className={`text-2xl font-extrabold ${c.hot ? 'text-brand' : ''}`}>{c.n}</div>
          <div className="text-xs text-muted">{c.t}</div>
        </div>
      ))}
    </div>
  );
}
