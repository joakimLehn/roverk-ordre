import Link from 'next/link';
import type { Kpis } from '@/lib/kpi';
import { formatPrice } from '@/lib/format';

interface Card {
  n: string;
  label: string;
  /** Filteret kortet teller. Uten href er tallet en blindvei. */
  href?: string;
  hot?: boolean;
}

/**
 * KPI-rutenettet. Kun skrivebord: på mobil sa tre av fem kort det samme som
 * bunnlinja allerede sier, og de to som ikke gjorde det – Utestående og
 * Totalt – er kontortall. De vises på mobil bare i «Å fakturere»,
 * gjennom PengeSum, der de faktisk er svaret på noe.
 *
 * Hvert kort er en lenke til det filteret det teller.
 */
export function KpiRow({ kpis }: { kpis: Kpis }) {
  const cards: Card[] = [
    { n: String(kpis.nye), label: 'Nye ordrer', href: '/?view=alle&status=ny', hot: true },
    { n: String(kpis.underBygging), label: 'Under bygging', href: '/?view=alle&status=under_bygging' },
    { n: String(kpis.montertIkkeFakturert), label: 'Montert, ikke fakturert', href: '/?view=fakturere' },
    { n: formatPrice(kpis.utestaaendeNok), label: 'Utestående', href: '/?view=alle&faktura=fakturert' },
    { n: formatPrice(kpis.totalNok), label: 'Totalt ordrebeløp' },
  ];

  return (
    <div className="mb-4 hidden gap-3 md:grid md:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => {
        const body = (
          <>
            <div className={`text-2xl font-extrabold tabular-nums ${c.hot ? 'text-brand' : ''}`}>
              {c.n}
            </div>
            <div className={`text-xs text-muted ${c.href ? 'group-hover:text-ink' : ''}`}>{c.label}</div>
          </>
        );
        return c.href ? (
          <Link
            key={c.label}
            href={c.href}
            className="focus-ring group rounded-xl border border-line bg-white px-3.5 py-3 hover:border-brand"
          >
            {body}
          </Link>
        ) : (
          <div key={c.label} className="rounded-xl border border-line bg-white px-3.5 py-3">
            {body}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Pengetallene på mobil, vist bare i «Å fakturere». Der er de svaret på
 * spørsmålet man nettopp stilte, ikke pynt på toppen av hver skjerm.
 */
export function MoneySummary({ kpis }: { kpis: Kpis }) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-2 md:hidden">
      <div className="rounded-xl border border-line bg-white px-3 py-2.5">
        <div className="text-[19px] font-extrabold tabular-nums">{formatPrice(kpis.utestaaendeNok)}</div>
        <div className="text-[11px] text-muted">Utestående</div>
      </div>
      <div className="rounded-xl border border-line bg-white px-3 py-2.5">
        <div className="text-[19px] font-extrabold tabular-nums">{formatPrice(kpis.totalNok)}</div>
        <div className="text-[11px] text-muted">Totalt</div>
      </div>
    </div>
  );
}
