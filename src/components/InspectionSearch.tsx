import type { InspectionViewKey } from '@/lib/inspection';

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="8.7" cy="8.7" r="5.6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Søkefelt med samme rytme som ordrefilteret. GET, så Enter sender inn. */
export function InspectionSearch({
  vis,
  q,
}: {
  vis: InspectionViewKey;
  q?: string;
}) {
  return (
    <div className="mb-2.5 md:mb-3.5">
      <form method="get" className="relative min-w-0 md:max-w-sm">
        {vis !== 'kommende' ? <input type="hidden" name="vis" value={vis} /> : null}
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <SearchIcon />
        </span>
        <input
          type="search"
          name="q"
          defaultValue={q ?? ''}
          aria-label="Søk i befaringer"
          placeholder="Navn, telefon, adresse …"
          className="focus-ring min-h-[44px] w-full rounded-lg border border-line bg-white pl-9 pr-3 text-base md:min-h-[42px] md:text-sm"
        />
      </form>
    </div>
  );
}
