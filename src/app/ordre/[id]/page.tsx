import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getOrder } from '@/lib/db';
import { materialsFor } from '@/data/materials';
import { configEntries, formatDateNo, formatPrice, siteLabel } from '@/lib/format';
import { Header } from '@/components/Header';
import { StatusButtons } from '@/components/StatusButtons';
import { EconomyChecks, TestFlag } from '@/components/EconomyChecks';
import { NotesForm, PlannedDate } from '@/components/NotesForm';
import { CustomerForm } from '@/components/CustomerForm';

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
  const tdc = 'border-b border-line px-2.5 py-1.5';

  return (
    <>
      <Header email={email} />
      <main className="mx-auto max-w-3xl px-6 py-5">
        <Link href="/" className="text-[13px] text-muted">← Alle ordrer</Link>
        <h1 className="mt-2 text-xl font-bold">
          {siteLabel(order.site)}{order.product ? ` – ${order.product}` : ''} · {order.name}
        </h1>
        <p className="mb-5 text-[13px] text-muted">
          Mottatt {formatDateNo(order.created_at)} · {formatPrice(order.price_nok)} · #{order.id.slice(0, 8)}
        </p>

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

        {cfg.length > 0 && (
          <Section title="Bestilling">
            <div className="grid grid-cols-[160px_1fr] gap-y-1 text-[13.5px]">
              {cfg.map((r) => (
                <div key={r.key} className="contents">
                  <span className="text-muted">{r.key}</span>
                  <span>{r.value}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section title="Materialbehov">
          {materials ? (
            <div className="overflow-x-auto rounded-xl border border-line bg-white">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-muted">
                    <th className={`${tdc} font-semibold`}>Materiale</th>
                    <th className={`${tdc} font-semibold`}>Dimensjon</th>
                    <th className={`${tdc} font-semibold`}>Antall</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.items.map((m) => (
                    <tr key={m.navn}>
                      <td className={tdc}>
                        {m.navn}
                        {m.merknad ? <span className="block text-xs text-muted">{m.merknad}</span> : null}
                      </td>
                      <td className={tdc}>{m.dimensjon}</td>
                      <td className={`${tdc} whitespace-nowrap`}>{m.antall}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-2.5 py-1.5 text-xs text-muted">
                {materials.perUnit ? 'Per enhet · ' : ''}Kilde: {materials.source}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted">Materialliste mangler for denne varianten.</p>
          )}
        </Section>

        <Section title="Interne notater">
          <NotesForm orderId={order.id} notes={order.internal_notes ?? ''} />
        </Section>

        <div className="border-t border-dashed border-line pt-4">
          <TestFlag orderId={order.id} isTest={order.is_test} />
        </div>
      </main>
    </>
  );
}
