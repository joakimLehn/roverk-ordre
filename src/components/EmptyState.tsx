import Link from 'next/link';

/**
 * En tom visning skal tilby en vei videre. «Ingen ordrer i denne visningen.»
 * alene er en blindvei – særlig på mobil, der filtrene som førte deg hit
 * ligger sammenslått bak en knapp.
 */
export function EmptyState({
  message,
  actions,
}: {
  message: string;
  actions: { label: string; href: string }[];
}) {
  return (
    <div className="rounded-2xl border border-line bg-white px-5 py-9 text-center md:rounded-xl md:py-8">
      <p className="text-sm text-muted">{message}</p>
      {actions.length > 0 ? (
        <div className="mt-3.5 flex flex-wrap justify-center gap-2">
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="focus-ring flex min-h-[44px] items-center rounded-lg border border-line bg-white px-4 text-[13.5px] font-bold hover:border-brand"
            >
              {a.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
