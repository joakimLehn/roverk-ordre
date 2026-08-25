import Link from 'next/link';
import {
  INSPECTION_VIEWS,
  inspectionViewHref,
  type InspectionViewKey,
} from '@/lib/inspection';

/** Visningsvalg på skrivebord. På mobil gjør InspectionBottomNav samme jobb. */
export function InspectionViewTabs({
  active,
  counts,
  params,
}: {
  active: InspectionViewKey;
  counts: Record<InspectionViewKey, number>;
  params: Record<string, string | undefined>;
}) {
  return (
    <nav aria-label="Visninger" className="mb-3 hidden gap-1.5 md:flex">
      {INSPECTION_VIEWS.map((v) => {
        const on = v.key === active;
        return (
          <Link
            key={v.key}
            href={inspectionViewHref(v.key, params)}
            aria-current={on ? 'page' : undefined}
            className={`focus-ring flex min-h-[38px] items-center whitespace-nowrap rounded-full border px-4 text-[13.5px] font-semibold ${
              on ? 'border-ink bg-ink text-white' : 'border-line bg-white text-muted hover:text-ink'
            }`}
          >
            {v.label}
            <span className={`ml-1.5 tabular-nums ${on ? '' : 'text-muted'}`}>{counts[v.key]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
