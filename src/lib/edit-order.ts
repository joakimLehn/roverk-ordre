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
function schemaSite(site: string): string | null {
  if (site === 'orden-v2') return 'orden';
  if ((MANUAL_SITES as readonly string[]).includes(site)) return site;
  return null;
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
