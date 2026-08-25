import { materialsFor } from '@/data/materials';
import { configEntries, formatDateNo, formatPrice, siteLabel } from '@/lib/format';
import { schemaSite } from '@/lib/edit-order';
import type { OrderFileView } from '@/lib/order-file';
import type { Order } from '@/lib/types';
import { ContactActions } from '@/components/ContactActions';
import { StatusButtons } from '@/components/StatusButtons';
import { EconomyChecks } from '@/components/EconomyChecks';
import { NotesForm, PlannedDate } from '@/components/NotesForm';
import { CustomerForm } from '@/components/CustomerForm';
import { BestillingForm } from '@/components/BestillingForm';
import { OrderAttachments } from '@/components/OrderAttachments';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</h3>
      {children}
    </section>
  );
}

export function OrderTitle({ order }: { order: Order }) {
  return (
    <>
      <h1 className="text-[19px] font-extrabold leading-tight md:text-xl">
        {siteLabel(order.site)}{order.product ? ` – ${order.product}` : ''}
      </h1>
      <p className="mb-4 text-[13px] text-muted">
        {order.name} · {formatPrice(order.price_nok)} · mottatt {formatDateNo(order.created_at)}
      </p>
    </>
  );
}

export function OrderMaterials({ order }: { order: Order }) {
  const materials = materialsFor(order.site, order.config);
  return (
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
  );
}

/**
 * Innholdet i en ordre, delt mellom hele detaljsiden og sidepanelet på
 * skrivebord. `compact` kutter feltene man ikke redigerer mens man går gjennom
 * en bunke – panelet skal svare «hva er dette», ikke være et helt skjema.
 */
export function OrderDetail({
  order,
  compact = false,
  files,
}: {
  order: Order;
  compact?: boolean;
  files?: OrderFileView[];
}) {
  const cfg = configEntries(order.config);

  return (
    <>
      <ContactActions phone={order.phone} address={order.address} />

      <Section title="Byggstatus">
        <StatusButtons orderId={order.id} kunde={order.name} current={order.build_status} />
      </Section>

      {compact ? null : (
        <Section title="Bilder og vedlegg">
          <OrderAttachments orderId={order.id} files={files ?? []} />
        </Section>
      )}

      <Section title="Økonomi">
        <EconomyChecks
          orderId={order.id}
          kunde={order.name}
          invoiced={!!order.invoiced_at}
          paid={!!order.paid_at}
        />
      </Section>

      <Section title="Planlagt byggedato">
        <PlannedDate orderId={order.id} date={order.planned_build_date ?? ''} />
      </Section>

      {compact ? (
        <Section title="Kunde">
          <dl className="grid grid-cols-[92px_minmax(0,1fr)] gap-y-1.5 rounded-xl border border-line bg-white p-3.5 text-[13px]">
            <dt className="text-muted">Telefon</dt>
            <dd className="font-semibold">{order.phone ?? '–'}</dd>
            <dt className="text-muted">E-post</dt>
            <dd className="truncate font-semibold">{order.email ?? '–'}</dd>
            <dt className="text-muted">Adresse</dt>
            <dd className="font-semibold">{order.address ?? '–'}</dd>
            <dt className="text-muted">Ønsket dato</dt>
            <dd className="font-semibold">{formatDateNo(order.preferred_date)}</dd>
          </dl>
        </Section>
      ) : (
        <Section title="Kunde">
          <CustomerForm order={order} />
        </Section>
      )}

      {compact ? (
        cfg.length > 0 ? (
          <Section title="Bestilling">
            <dl className="grid grid-cols-[92px_minmax(0,1fr)] gap-y-1.5 rounded-xl border border-line bg-white p-3.5 text-[13px]">
              {cfg.map((c) => (
                <div key={c.key} className="col-span-2 grid grid-cols-subgrid">
                  <dt className="text-muted">{c.key}</dt>
                  <dd className="font-semibold">{c.value}</dd>
                </div>
              ))}
            </dl>
          </Section>
        ) : null
      ) : cfg.length > 0 || schemaSite(order.site) ? (
        <Section title="Bestilling">
          <BestillingForm order={order} />
        </Section>
      ) : null}

      <OrderMaterials order={order} />

      {compact ? null : (
        <Section title="Interne notater">
          <NotesForm orderId={order.id} notes={order.internal_notes ?? ''} />
        </Section>
      )}
    </>
  );
}
