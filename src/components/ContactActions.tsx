import type { Order } from '@/lib/types';

// Ring og veibeskrivelse som knapper – på mobil er dette de to handlingene
// snekkeren faktisk trenger fra en ordre.
export function ContactActions({ order }: { order: Order }) {
  const mapUrl = order.address
    ? `https://maps.google.com/?q=${encodeURIComponent(order.address)}`
    : null;

  if (!order.phone && !mapUrl) return null;

  const btn =
    'flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-white text-sm font-bold text-ink';

  return (
    <div className="mb-5 flex gap-2">
      {order.phone ? (
        <a href={`tel:${order.phone.replace(/\s/g, '')}`} className={btn}>
          📞 Ring
        </a>
      ) : null}
      {mapUrl ? (
        <a href={mapUrl} target="_blank" rel="noreferrer" className={btn}>
          🧭 Veibeskrivelse
        </a>
      ) : null}
    </div>
  );
}
