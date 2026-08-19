import Link from 'next/link';
import { VIEWS, viewHref, type ViewKey } from '@/lib/views';

/**
 * Mobilens primærnavigasjon, nederst.
 *
 * Visningsbytte er det som gjøres oftest, og lå tidligere øverst på skjermen –
 * utenfor rekkevidde for tommelen på en telefon som holdes i én hånd, og ute
 * av syne så snart lista rulles. Her bærer den også tallene, som gjør
 * KPI-stripa på mobil overflødig.
 */
export function BottomNav({
  active,
  counts,
  params,
}: {
  active: ViewKey;
  counts: Record<ViewKey, number>;
  params: Record<string, string | undefined>;
}) {
  return (
    <nav
      aria-label="Visninger"
      className="fixed inset-x-0 bottom-0 z-40 flex gap-1.5 border-t border-line bg-white px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-1.5 md:hidden"
    >
      {VIEWS.map((v) => {
        const on = v.key === active;
        return (
          <Link
            key={v.key}
            href={viewHref(v.key, params)}
            aria-current={on ? 'page' : undefined}
            className={`focus-ring flex min-h-[50px] flex-1 flex-col items-center justify-center gap-px rounded-xl ${
              on ? 'bg-sand text-ink' : 'text-muted'
            }`}
          >
            <span className={`text-[16px] font-extrabold tabular-nums leading-tight ${on ? 'text-brand' : ''}`}>
              {counts[v.key]}
            </span>
            <span className="text-[10.5px] font-semibold">{v.label}</span>
          </Link>
        );
      })}
      <Link
        href="/ordre/ny"
        aria-label="Ny ordre"
        className="focus-ring flex min-h-[50px] w-[52px] items-center justify-center rounded-xl bg-brand text-[23px] font-normal leading-none text-white"
      >
        +
      </Link>
    </nav>
  );
}
