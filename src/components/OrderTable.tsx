import Link from 'next/link';
import type { Order } from '@/lib/types';
import { StatusBadge, TestBadge } from './Badge';
import { formatDateNo, formatPrice, siteLabel } from '@/lib/format';

const td = 'border-b border-line px-3 py-2.5';

export function OrderTable({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-white p-8 text-center text-sm text-muted">
        Ingen ordrer matcher filteret.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-muted">
            {['Mottatt', 'Produkt', 'Kunde', 'Pris', 'Byggstatus', 'Faktura', 'Byggedato'].map((h) => (
              <th key={h} className="border-b border-line px-3 py-2.5 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className={`hover:bg-sand ${o.is_test ? 'opacity-45' : ''}`}>
              <td className={`${td} whitespace-nowrap`}>
                <Link href={`/ordre/${o.id}`} className="block">{formatDateNo(o.created_at)}</Link>
              </td>
              <td className={`${td} font-semibold`}>
                <Link href={`/ordre/${o.id}`} className="block">
                  {siteLabel(o.site)}{o.product ? ` – ${o.product}` : ''}
                </Link>
              </td>
              <td className={td}>
                <Link href={`/ordre/${o.id}`} className="block">
                  {o.name}
                  {o.address_meta?.poststed ? (
                    <span className="block text-xs text-muted">{String(o.address_meta.poststed)}</span>
                  ) : null}
                </Link>
              </td>
              <td className={`${td} whitespace-nowrap`}>{formatPrice(o.price_nok)}</td>
              <td className={td}>
                {o.is_test ? <TestBadge /> : <StatusBadge status={o.build_status} />}
              </td>
              <td className={`${td} text-xs whitespace-nowrap`}>
                {o.paid_at ? (
                  <span className="font-bold text-ok">✓ Betalt</span>
                ) : o.invoiced_at ? (
                  <span><span className="font-bold text-ok">✓ Fakturert</span> · ikke betalt</span>
                ) : (
                  <span className="text-muted">–</span>
                )}
              </td>
              <td className={`${td} text-xs whitespace-nowrap`}>{formatDateNo(o.planned_build_date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
