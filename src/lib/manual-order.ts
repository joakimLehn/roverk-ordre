import { normalizeEmail } from './email';

export interface ManualOrderInput {
  site: string;
  product: string | null;
  config: Record<string, unknown>; // samme skjema som nettsidens konfiguratorer
  kanal: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  price_nok: number | null;
  preferred_date: string | null;
  internal_notes: string | null;
}

export const MANUAL_SITES = ['skjul', 'ved', 'orden'] as const;
export const KANALER = ['E-post', 'Instagram', 'Facebook', 'Telefon', 'Annet'] as const;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type ParseResult =
  | { ok: true; data: ManualOrderInput }
  | { ok: false; error: string };

function intInRange(raw: string, min: number, max: number): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

/** Tom streng → null; «12 500» → 12500; ugyldig/negativ → feil. */
export function parsePriceNok(
  raw: string | undefined,
): { ok: true; value: number | null } | { ok: false; error: string } {
  const priceRaw = (raw ?? '').replace(/[\s.]/g, '').replace(',', '.');
  if (!priceRaw) return { ok: true, value: null };
  const n = Number(priceRaw);
  if (!Number.isFinite(n) || n < 0) return { ok: false, error: 'Ugyldig pris.' };
  return { ok: true, value: Math.round(n) };
}

/** Bygger config (nettsidens skjema) + generert produkttekst per produkt. */
export function buildProduct(site: string, f: Record<string, string>):
  | { config: Record<string, unknown>; productText: string }
  | { error: string } {
  if (site === 'skjul') {
    const count = intInRange(f.skjul_count ?? '', 1, 8);
    if (count == null) return { error: 'Antall dunker må være 1–8.' };
    const serie = f.skjul_serie === 'XL' ? 'XL' : 'Standard';
    const kledning = f.skjul_kledning === 'royal' ? 'royal' : 'ubeh';
    return {
      config: {
        count,
        serie,
        kledning,
        montering: f.skjul_montering === 'on',
        forankring: f.skjul_forankring === 'on',
      },
      productText: `${count}-dunk ${serie}`,
    };
  }
  if (site === 'ved') {
    const modell = f.ved_modell === 'Stor' ? 'Stor' : 'Medium';
    return {
      config: { navn: modell, size: modell.toLowerCase() },
      productText: `Vedskjul ${modell}`,
    };
  }
  // orden
  const bt = f.orden_bt === '100L' ? '100L' : '60L';
  const w = intInRange(f.orden_w ?? '', 1, 5);
  const h = intInRange(f.orden_h ?? '', 3, 7);
  if (w == null || h == null) return { error: 'Orden: bredde må være 1–5 og høyde 3–7 kasser.' };
  return {
    config: { bt, w, h, withWheels: f.orden_hjul === 'on' },
    productText: `Orden ${bt} · ${w}×${h}`,
  };
}

export function parseManualOrder(f: Record<string, string>): ParseResult {
  const site = (f.site ?? '').trim();
  if (!(MANUAL_SITES as readonly string[]).includes(site)) {
    return { ok: false, error: 'Velg produkt.' };
  }

  const name = (f.name ?? '').trim();
  if (!name) return { ok: false, error: 'Kundenavn er påkrevd.' };

  const built = buildProduct(site, f);
  if ('error' in built) return { ok: false, error: built.error };

  const emailRaw = (f.email ?? '').trim();
  const email = emailRaw ? normalizeEmail(emailRaw) : null;
  if (emailRaw && !email) return { ok: false, error: 'Ugyldig e-postadresse.' };

  const price = parsePriceNok(f.price_nok);
  if (!price.ok) return { ok: false, error: price.error };
  const price_nok = price.value;

  const pd = (f.preferred_date ?? '').trim();
  const kanal = (f.kanal ?? '').trim();

  return {
    ok: true,
    data: {
      site,
      product: (f.product ?? '').trim() || built.productText,
      config: built.config,
      kanal: (KANALER as readonly string[]).includes(kanal) ? kanal : 'Annet',
      name,
      phone: (f.phone ?? '').trim() || null,
      email,
      address: (f.address ?? '').trim() || null,
      price_nok,
      preferred_date: ISO_DATE_RE.test(pd) ? pd : null,
      internal_notes: (f.notes ?? '').trim() || null,
    },
  };
}
