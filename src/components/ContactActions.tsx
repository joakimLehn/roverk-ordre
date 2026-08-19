import type { Order } from '@/lib/types';

// Ring og veibeskrivelse som knapper – på mobil er dette de to handlingene
// snekkeren faktisk trenger fra en ordre.
//
// Ikonene er inline SVG, ikke emoji: 📞 og 🧭 rendres ulikt per plattform, og
// skjermlesere leser opp emojinavnet midt i knappeteksten.

function PhoneIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4 3h3l1.6 4-2 1.4a10 10 0 005 5L13 11.4 17 13v3a1 1 0 01-1.1 1A14 14 0 013 4.1A1 1 0 014 3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12.8 7.2l-2 4-3.6 1.6 2-4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ContactActions({ order }: { order: Order }) {
  const mapUrl = order.address
    ? `https://maps.google.com/?q=${encodeURIComponent(order.address)}`
    : null;

  if (!order.phone && !mapUrl) return null;

  const btn =
    'focus-ring flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-white text-sm font-bold text-ink';

  return (
    <div className="mb-5 flex gap-2">
      {order.phone ? (
        <a href={`tel:${order.phone.replace(/\s/g, '')}`} className={btn}>
          <PhoneIcon /> Ring
        </a>
      ) : null}
      {mapUrl ? (
        <a href={mapUrl} target="_blank" rel="noreferrer" className={btn}>
          <CompassIcon /> Veibeskrivelse
        </a>
      ) : null}
    </div>
  );
}
