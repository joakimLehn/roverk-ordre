import { requireUser } from '@/lib/auth';
import { listOrders } from '@/lib/db';
import { computeKpis } from '@/lib/kpi';
import { Header } from '@/components/Header';
import { KpiRow } from '@/components/Kpis';
import { Filters, type FilterParams } from '@/components/Filters';
import { OrderTable } from '@/components/OrderTable';
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
        o.email.toLowerCase().includes(q) ||
        o.phone.includes(q),
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
  const all = await listOrders();
  const filtered = applyFilters(all, params);
  const kpis = computeKpis(all);

  return (
    <>
      <Header email={email} />
      <main className="mx-auto max-w-6xl px-6 py-5">
        <KpiRow kpis={kpis} />
        <Filters params={params} />
        <OrderTable orders={filtered} />
      </main>
    </>
  );
}
