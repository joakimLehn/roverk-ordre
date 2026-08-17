import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getOrder } from '@/lib/db';
import { materialsFor } from '@/data/materials';
import { configEntries, formatDateNo, formatPrice, siteLabel } from '@/lib/format';
import { Header } from '@/components/Header';
import { ContactActions } from '@/components/ContactActions';
import { StatusButtons } from '@/components/StatusButtons';
import { EconomyChecks, TestFlag } from '@/components/EconomyChecks';
import { NotesForm, PlannedDate } from '@/components/NotesForm';
import { CustomerForm } from '@/components/CustomerForm';
import { BestillingForm } from '@/components/BestillingForm';
import { schemaSite } from '@/lib/edit-order';

export const dynamic = 'force-dynamic';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</h3>
      {children}
    </section>
  );
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { email } = await requireUser();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const materials = materialsFor(order.site, order.config);
  const cfg = configEntries(order.config);

  return (
    <>
      <Header email={email} />
      <main className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-5">
        <Link href="/" className="flex min-h-[36px] items-center text-[13px] text-muted">
          ← Alle ordrer
        </Link>
        <h1 className="mt-1 text-[19px] font-extrabold leading-tight sm:text-xl">
          {siteLabel(order.site)}{order.product ? ` – ${order.product}` : ''}
        </h1>
        <p className="mb-4 text-[13px] text-muted">
          {order.name} · {formatPrice(order.price_nok)} · mottatt {formatDateNo(order.created_at)}
        </p>

        <ContactActions order={order} />

        <Section title="Byggstatus">
          <StatusButtons orderId={order.id} current={order.build_status} />
        </Section>

        <Section title="Økonomi">
          <EconomyChecks orderId={order.id} invoiced={!!order.invoiced_at} paid={!!order.paid_at} />
        </Section>

        <Section title="Planlagt byggedato">
          <PlannedDate orderId={order.id} date={order.planned_build_date ?? ''} />
        </Section>

        <Section title="Kunde">
          <CustomerForm order={order} />
        </Section>

        {cfg.length > 0 || schemaSite(order.site) ? (
          <Section title="Bestilling">
            <BestillingForm order={order} />
          </Section>
        ) : null}

        <Section title={materials?.perUnit ? 'Materialbehov · per enhet' : 'Materialbehov'}>
          {materials ? (
            <div className="overflow-hidden rounded-xl border border-line bg-white">
              {materials.items.map((m) => (
                <div
                  key={m.navn}
                  className="flex items-start justify-between gap-3 border-b border-line px-3.5 py-2.5 last:border-b-0"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{m.navn}</div>
                    <div className="text-xs text-muted">{m.dimensjon}</div>
                    {m.merknad ? <div className="mt-0.5 text-xs text-muted">{m.merknad}</div> : null}
                  </div>
                  <div className="whitespace-nowrap text-sm font-bold tabular-nums">{m.antall}</div>
                </div>
              ))}
              <p className="bg-sand px-3.5 py-2 text-xs text-muted">Kilde: {materials.source}</p>
            </div>
          ) : (
            <p className="rounded-xl border border-line bg-white p-3.5 text-sm text-muted">
              Materialliste mangler for denne varianten.
            </p>
          )}
        </Section>

        <Section title="Interne notater">
          <NotesForm orderId={order.id} notes={order.internal_notes ?? ''} />
        </Section>

        <div className="border-t border-dashed border-line pt-3">
          <TestFlag orderId={order.id} isTest={order.is_test} />
        </div>
      </main>
    </>
  );
}
