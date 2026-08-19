import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { listOrders } from '@/lib/db';
import { computeKpis } from '@/lib/kpi';
import { groupByBuildDate, osloDate } from '@/lib/groups';
import { sortOrders } from '@/lib/sort';
import { applyView, isViewKey, listHref, viewCounts, type ViewKey } from '@/lib/views';
import { Header } from '@/components/Header';
import { KpiRow, MoneySummary } from '@/components/Kpis';
import { Filters, type FilterParams } from '@/components/Filters';
import { OrderTable } from '@/components/OrderTable';
import { OrderCard } from '@/components/OrderCard';
import { ViewTabs } from '@/components/ViewTabs';
import { BottomNav } from '@/components/BottomNav';
import { EmptyState } from '@/components/EmptyState';
import { OrderDetail, OrderTitle } from '@/components/OrderDetail';
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

function hasFilters(p: FilterParams): boolean {
  return Boolean(p.q || p.produkt || p.status || p.faktura);
}

const EMPTY_MESSAGE: Record<ViewKey, string> = {
  bygge: 'Ingenting står til bygging nå.',
  fakturere: 'Ingenting venter på faktura nå.',
  alle: 'Ingen ordrer å vise.',
};

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

  // Alder og «i dag» regnes ut på serveren. Klientens klokke ville gitt ulike
  // verdier ved hydrering, og i Norge er UTC-dagen feil hele natta.
  const now = new Date().toISOString();
  const today = osloDate(now);

  // Fanene teller innenfor gjeldende filtre, så tallene stemmer med det du ser.
  const filtered = applyFilters(all, params);
  const counts = viewCounts(filtered);
  const visible = applyView(filtered, view);

  // «Å bygge» grupperes på byggedato: da blir lista en plan, ikke en logg.
  const groups = view === 'bygge' ? groupByBuildDate(visible, today) : null;
  const sorted = sortOrders(visible, params.sort, now);

  // Ordren i sidepanelet må ligge i lista man ser på – ellers peker panelet på
  // noe som ikke er der etter et filterbytte.
  const selected = params.valgt ? sorted.find((o) => o.id === params.valgt) : undefined;

  const emptyActions = hasFilters(params)
    ? [
        { label: 'Nullstill filter', href: listHref({ view: params.view }, {}) },
        { label: '+ Ny ordre', href: '/ordre/ny' },
      ]
    : view === 'alle'
      ? [{ label: '+ Ny ordre', href: '/ordre/ny' }]
      : [
          { label: 'Se alle ordrer', href: '/?view=alle' },
          { label: '+ Ny ordre', href: '/ordre/ny' },
        ];

  return (
    <>
      <Header email={email} />
      {/* Bunnpolstringen holder det siste kortet klar av bunnlinja. */}
      <main className="mx-auto max-w-[1440px] px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+80px)] md:px-6 md:py-5 md:pb-8">
        <div className="mb-3 hidden items-center justify-between md:mb-4 md:flex">
          <h1 className="text-lg font-bold">Ordrer</h1>
          <div className="flex items-center gap-4">
            <p className="hidden text-[11.5px] text-muted lg:block">
              <Kbd>/</Kbd> søk <Kbd>j</Kbd>
              <Kbd>k</Kbd> rad <Kbd>↵</Kbd> åpne
            </p>
            <Link
              href="/ordre/ny"
              className="focus-ring rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white"
            >
              + Ny ordre
            </Link>
          </div>
        </div>

        <KpiRow kpis={kpis} />
        <ViewTabs active={view} counts={counts} params={params} />
        {view === 'fakturere' ? <MoneySummary kpis={kpis} /> : null}
        <Filters params={params} />

        {visible.length === 0 ? (
          <EmptyState message={EMPTY_MESSAGE[view]} actions={emptyActions} />
        ) : (
          <>
            {/* Mobil: kort, gruppert på byggedato i «Å bygge». */}
            <div className="md:hidden">
              {groups ? (
                groups.map((g) => (
                  <section key={g.key} className="mb-1">
                    <h2 className="flex items-center gap-2 px-0.5 pb-1.5 pt-3">
                      <span
                        className={`text-[11px] font-extrabold uppercase tracking-wider ${
                          g.key === 'forfalt' ? 'text-danger' : g.key === 'i_dag' ? 'text-brand' : 'text-muted'
                        }`}
                      >
                        {g.label}
                      </span>
                      <span className="rounded-full bg-line px-1.5 text-[11px] font-bold tabular-nums text-muted">
                        {g.orders.length}
                      </span>
                      <span className="h-px flex-1 bg-line" />
                    </h2>
                    <div className="flex flex-col gap-2.5">
                      {g.orders.map((o) => (
                        <OrderCard key={o.id} order={o} now={now} />
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <div className="flex flex-col gap-2.5">
                  {visible.map((o) => (
                    <OrderCard key={o.id} order={o} now={now} />
                  ))}
                </div>
              )}
            </div>

            {/* Skrivebord: tabell, med detaljene i et sidepanel fra lg. */}
            <div className="hidden gap-4 md:grid lg:grid-cols-[minmax(0,1fr)_374px] lg:items-start">
              <OrderTable
                orders={sorted}
                now={now}
                sort={params.sort}
                selectedId={selected?.id}
                hrefForSort={(value) => listHref(params, { sort: value })}
                hrefForSelect={(id) => listHref(params, { valgt: id })}
              />
              <aside className="hidden lg:sticky lg:top-5 lg:block">
                {selected ? (
                  <div className="max-h-[calc(100vh-3rem)] overflow-y-auto rounded-xl border border-line bg-sand p-4">
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <OrderTitle order={selected} />
                      </div>
                      <Link
                        href={listHref(params, { valgt: undefined })}
                        scroll={false}
                        aria-label="Lukk panelet"
                        className="focus-ring -mr-1 -mt-1 flex h-8 w-8 flex-none items-center justify-center rounded-lg text-muted hover:bg-line"
                      >
                        ✕
                      </Link>
                    </div>
                    <OrderDetail order={selected} compact />
                    <Link
                      href={`/ordre/${selected.id}`}
                      className="focus-ring flex min-h-[44px] items-center justify-center rounded-xl border border-line bg-white text-[13.5px] font-bold"
                    >
                      Åpne hele ordren
                    </Link>
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted">
                    Velg en rad for å se ordren her.
                  </p>
                )}
              </aside>
            </div>
          </>
        )}
      </main>

      <BottomNav active={view} counts={counts} params={params} />
    </>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="mx-0.5 rounded border border-line border-b-2 bg-sand px-1.5 font-sans text-[10.5px]">
      {children}
    </kbd>
  );
}
