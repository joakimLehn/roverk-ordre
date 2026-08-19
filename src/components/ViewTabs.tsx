import Link from 'next/link';
import { VIEWS, viewHref, type ViewKey } from '@/lib/views';

/** Visningsvalg på skrivebord. På mobil gjør BottomNav samme jobb, nederst. */
export function ViewTabs({
  active,
  counts,
  params,
}: {
  active: ViewKey;
  counts: Record<ViewKey, number>;
  params: Record<string, string | undefined>;
}) {
  return (
    <nav aria-label="Visninger" className="mb-3 hidden gap-1.5 md:flex">
      {VIEWS.map((v) => {
        const on = v.key === active;
        return (
          <Link
            key={v.key}
            href={viewHref(v.key, params)}
            aria-current={on ? 'page' : undefined}
            className={`focus-ring flex min-h-[38px] items-center whitespace-nowrap rounded-full border px-4 text-[13.5px] font-semibold ${
              on ? 'border-ink bg-ink text-white' : 'border-line bg-white text-muted hover:text-ink'
            }`}
          >
            {v.label}
            <span className="ml-1.5 tabular-nums opacity-65">{counts[v.key]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
