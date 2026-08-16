import Link from 'next/link';
import { VIEWS, type ViewKey } from '@/lib/views';

export function ViewTabs({
  active,
  counts,
  params,
}: {
  active: ViewKey;
  counts: Record<ViewKey, number>;
  params: Record<string, string | undefined>;
}) {
  function hrefFor(key: ViewKey): string {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v && k !== 'view') sp.set(k, v);
    }
    if (key !== 'bygge') sp.set('view', key);
    const q = sp.toString();
    return q ? `/?${q}` : '/';
  }

  return (
    <nav className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {VIEWS.map((v) => (
        <Link
          key={v.key}
          href={hrefFor(v.key)}
          className={`flex min-h-[42px] items-center whitespace-nowrap rounded-full border px-4 text-[13.5px] font-semibold ${
            v.key === active
              ? 'border-ink bg-ink text-white'
              : 'border-line bg-white text-muted'
          }`}
        >
          {v.label}
          <span className="ml-1.5 tabular-nums opacity-65">{counts[v.key]}</span>
        </Link>
      ))}
    </nav>
  );
}
