import { buildProduct, KANALER, MANUAL_SITES, parsePriceNok } from './manual-order';

export interface BestillingEdit {
  config: Record<string, unknown>;
  product: string;
  price_nok: number | null;
}

export type EditResult =
  | { ok: true; data: BestillingEdit }
  | { ok: false; error: string };

const APP_KEYS = ['manuell', 'kanal', 'registrert_av'] as const;

/** Nettsidens orden-v2 bruker samme config-skjema som orden. Site-kolonnen røres ikke. */
export function schemaSite(site: string): string | null {
  if (site === 'orden-v2') return 'orden';
  if ((MANUAL_SITES as readonly string[]).includes(site)) return site;
  return null;
}

/** Samme standardverdier som NewOrderForm har i feltene i dag. */
export interface ProductFieldDefaults {
  skjul_count: string;
  skjul_serie: string;
  skjul_kledning: string;
  skjul_montering: boolean;
  skjul_forankring: boolean;
  ved_modell: string;
  orden_bt: string;
  orden_w: string;
  orden_h: string;
  orden_hjul: boolean;
}

export const NEW_ORDER_FIELD_DEFAULTS: ProductFieldDefaults = {
  skjul_count: '4',
  skjul_serie: 'Standard',
  skjul_kledning: 'ubeh',
  skjul_montering: true,
  skjul_forankring: false,
  ved_modell: 'Medium',
  orden_bt: '60L',
  orden_w: '3',
  orden_h: '4',
  orden_hjul: false,
};

function intInRangeAsString(v: unknown, min: number, max: number): string | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isInteger(n) && n >= min && n <= max ? String(n) : null;
}

/** Mapper ordre-config til skjemafelter. Ukjent site → null (skjul Rediger).
 *  Manglende/ugyldige nøkler faller tilbake til NewOrder-defaults. */
export function bestillingFormDefaults(
  site: string,
  config: Record<string, unknown>,
): ProductFieldDefaults | null {
  const schema = schemaSite(site);
  if (schema == null) return null;
  const d = NEW_ORDER_FIELD_DEFAULTS;

  if (schema === 'skjul') {
    const serie = String(config.serie ?? '').toLowerCase();
    return {
      ...d,
      skjul_count: intInRangeAsString(config.count, 1, 8) ?? d.skjul_count,
      skjul_serie: serie === 'xl' ? 'XL' : serie === 'standard' ? 'Standard' : d.skjul_serie,
      skjul_kledning:
        config.kledning === 'royal' ? 'royal' : config.kledning === 'ubeh' ? 'ubeh' : d.skjul_kledning,
      skjul_montering: typeof config.montering === 'boolean' ? config.montering : d.skjul_montering,
      skjul_forankring: typeof config.forankring === 'boolean' ? config.forankring : d.skjul_forankring,
    };
  }
  if (schema === 'ved') {
    const navn = typeof config.navn === 'string' ? config.navn : '';
    const size = typeof config.size === 'string' ? config.size.toLowerCase() : '';
    const modell =
      navn === 'Stor' || size === 'stor' ? 'Stor'
        : navn === 'Medium' || size === 'medium' ? 'Medium'
          : d.ved_modell;
    return { ...d, ved_modell: modell };
  }
  return {
    ...d,
    orden_bt: config.bt === '100L' ? '100L' : config.bt === '60L' ? '60L' : d.orden_bt,
    orden_w: intInRangeAsString(config.w, 1, 5) ?? d.orden_w,
    orden_h: intInRangeAsString(config.h, 3, 7) ?? d.orden_h,
    orden_hjul: typeof config.withWheels === 'boolean' ? config.withWheels : d.orden_hjul,
  };
}

/** Validerer skjemafelter og bygger ny config for en eksisterende ordre.
 *  site kommer fra ordren, aldri fra skjemaet. */
export function parseBestillingEdit(
  order: { site: string; config: Record<string, unknown>; price_nok: number | null },
  f: Record<string, string>,
  redigertAv: string,
  naaIso: string,
): EditResult {
  const site = schemaSite(order.site);
  if (site == null) return { ok: false, error: 'Ukjent produkt.' };

  const built = buildProduct(site, f);
  if ('error' in built) return { ok: false, error: built.error };

  const price = parsePriceNok(f.price_nok);
  if (!price.ok) return { ok: false, error: price.error };

  const config: Record<string, unknown> = { ...built.config };
  for (const key of APP_KEYS) {
    if (key in order.config) config[key] = order.config[key];
  }

  if (order.config.manuell === true) {
    const kanal = (f.kanal ?? '').trim();
    if ((KANALER as readonly string[]).includes(kanal)) config.kanal = kanal;
  }

  config.redigert_av = redigertAv;
  config.redigert_kl = naaIso;

  return {
    ok: true,
    data: {
      config,
      product: built.productText,
      price_nok: price.value,
    },
  };
}
