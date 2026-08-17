import {
  NEW_ORDER_FIELD_DEFAULTS,
  schemaSite,
  type ProductFieldDefaults,
} from '@/lib/edit-order';

const input = 'min-h-[46px] w-full rounded-lg border border-line bg-white px-3 py-2 text-base sm:text-sm';
const label = 'block text-xs font-semibold text-muted';

function SkjulFields({ d }: { d: ProductFieldDefaults }) {
  return (
    <fieldset className="grid gap-3 rounded-xl border border-line bg-sand/60 p-3.5">
      <legend className="px-1 text-xs font-semibold text-muted">Skjul-konfigurasjon</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className={label}>
          Antall dunker *
          <select name="skjul_count" defaultValue={d.skjul_count} className={`${input} mt-1`}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className={label}>
          Serie *
          <select name="skjul_serie" defaultValue={d.skjul_serie} className={`${input} mt-1`}>
            <option value="Standard">Standard</option>
            <option value="XL">XL</option>
          </select>
        </label>
        <label className={label}>
          Kledning *
          <select name="skjul_kledning" defaultValue={d.skjul_kledning} className={`${input} mt-1`}>
            <option value="ubeh">Impregnert</option>
            <option value="royal">Royal</option>
          </select>
        </label>
      </div>
      <div className="flex gap-6">
        <label className="flex min-h-[44px] items-center gap-2.5 text-[15px]"><input type="checkbox" name="skjul_montering" defaultChecked={d.skjul_montering} /> Montering</label>
        <label className="flex min-h-[44px] items-center gap-2.5 text-[15px]"><input type="checkbox" name="skjul_forankring" defaultChecked={d.skjul_forankring} /> Forankring</label>
      </div>
    </fieldset>
  );
}

function VedFields({ d }: { d: ProductFieldDefaults }) {
  return (
    <fieldset className="grid gap-3 rounded-xl border border-line bg-sand/60 p-3.5">
      <legend className="px-1 text-xs font-semibold text-muted">Ved-konfigurasjon</legend>
      <label className={label}>
        Modell *
        <select name="ved_modell" defaultValue={d.ved_modell} className={`${input} mt-1`}>
          <option value="Medium">Medium</option>
          <option value="Stor">Stor</option>
        </select>
      </label>
    </fieldset>
  );
}

function OrdenFields({ d }: { d: ProductFieldDefaults }) {
  return (
    <fieldset className="grid gap-3 rounded-xl border border-line bg-sand/60 p-3.5">
      <legend className="px-1 text-xs font-semibold text-muted">Orden-konfigurasjon</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className={label}>
          Kassetype *
          <select name="orden_bt" defaultValue={d.orden_bt} className={`${input} mt-1`}>
            <option value="60L">60L</option>
            <option value="100L">100L</option>
          </select>
        </label>
        <label className={label}>
          Bredde (kasser) *
          <select name="orden_w" defaultValue={d.orden_w} className={`${input} mt-1`}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className={label}>
          Høyde (kasser) *
          <select name="orden_h" defaultValue={d.orden_h} className={`${input} mt-1`}>
            {[3, 4, 5, 6, 7].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      <label className="flex min-h-[44px] items-center gap-2.5 text-[15px]"><input type="checkbox" name="orden_hjul" defaultChecked={d.orden_hjul} /> Hjul</label>
    </fieldset>
  );
}

export function ProductConfigFields({
  site,
  defaults = NEW_ORDER_FIELD_DEFAULTS,
}: {
  site: string;
  defaults?: ProductFieldDefaults;
}) {
  const schema = schemaSite(site);
  if (schema === 'skjul') return <SkjulFields d={defaults} />;
  if (schema === 'ved') return <VedFields d={defaults} />;
  if (schema === 'orden') return <OrdenFields d={defaults} />;
  return null;
}
