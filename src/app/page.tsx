import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { listOrders } from '@/lib/db';
import { computeKpis } from '@/lib/kpi';
import { applyView, isViewKey, viewCounts, type ViewKey } from '@/lib/views';
import { Header } from '@/components/Header';
import { KpiRow } from '@/components/Kpis';
import { Filters, type FilterParams } from '@/components/Filters';
import { OrderTable } from '@/components/OrderTable';
import { OrderCard } from '@/components/OrderCard';
import { ViewTabs } from '@/components/ViewTabs';
import type { Order } from '@/lib/types';

export const dynamic = 'force-dynamic';

function applyFilters(orders: Order[], p: FilterParams): Order[] {
  let r = orders;
  if (p.vis_test !== '1') r = r.filter((o) => !o.is_test);
  if (p.produkt) r = r.filter((o) => (o.site === 'orden-v2' ? 'orden' : o.site) === p.produkt);
  if (p.status) r = r.filter((o) => o.build_status === p.status);
  if (p.faktura === 'ikke_fakturert') r = r.filter((o) => !o.invoiced_at);
  if (p.faktura === 'fakturert') r = r.filter((o) => o.invoiced_at && !o.paid_at);
  if (p.faktura === 'betalt') r = r.filter((o) => !!o.paid_at);
  if (p.q) {
    const q = p.q.toLowerCase();
    r = r.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        (o.email ?? '').toLowerCase().includes(q) ||
        (o.phone ?? '').includes(q),
    );
  }
  return r;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { email } = await requireUser();
  const params = (await searchParams) as FilterParams;
  const view: ViewKey = isViewKey(params.view) ? params.view : 'bygge';

  const all = await listOrders();
  const kpis = computeKpis(all);

  // Fanene teller innenfor gjeldende filtre, så tallene stemmer med det du ser.
  const filtered = applyFilters(all, params);
  const counts = viewCounts(filtered);
  const visible = applyView(filtered, view);

  return (
    <>
      <Header email={email} />
      <main className="mx-auto max-w-6xl px-4 py-4 pb-24 sm:px-6 sm:py-5 sm:pb-8">
        <div className="mb-3 flex items-center justify-between sm:mb-4">
          <h1 className="text-lg font-bold">Ordrer</h1>
          <Link
            href="/ordre/ny"
            className="hidden rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white sm:block"
          >
            + Ny ordre
          </Link>
        </div>

        <KpiRow kpis={kpis} />
        <ViewTabs active={view} counts={counts} params={params} />
        <Filters params={params} />

        {/* Mobil: kort. Skrivebord: tabell. */}
        <div className="flex flex-col gap-2.5 sm:hidden">
          {visible.length === 0 ? (
            <p className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-muted">
              Ingen ordrer i denne visningen.
            </p>
          ) : (
            visible.map((o) => <OrderCard key={o.id} order={o} />)
          )}
        </div>
        <div className="hidden sm:block">
          <OrderTable orders={visible} />
        </div>
      </main>

      <Link
        href="/ordre/ny"
        className="fixed bottom-5 right-4 rounded-full bg-brand px-5 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-brand/40 sm:hidden"
      >
        + Ny ordre
      </Link>
    </>
  );
}
