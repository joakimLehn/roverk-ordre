import { normalizeEmail } from './email';

export interface ManualOrderInput {
  site: string;
  product: string | null;
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

export function parseManualOrder(f: Record<string, string>): ParseResult {
  const site = (f.site ?? '').trim();
  if (!(MANUAL_SITES as readonly string[]).includes(site)) {
    return { ok: false, error: 'Velg produkt.' };
  }

  const name = (f.name ?? '').trim();
  if (!name) return { ok: false, error: 'Kundenavn er påkrevd.' };

  const emailRaw = (f.email ?? '').trim();
  const email = emailRaw ? normalizeEmail(emailRaw) : null;
  if (emailRaw && !email) return { ok: false, error: 'Ugyldig e-postadresse.' };

  let price_nok: number | null = null;
  const priceRaw = (f.price_nok ?? '').replace(/[\s.]/g, '').replace(',', '.');
  if (priceRaw) {
    const n = Number(priceRaw);
    if (!Number.isFinite(n) || n < 0) return { ok: false, error: 'Ugyldig pris.' };
    price_nok = Math.round(n);
  }

  const pd = (f.preferred_date ?? '').trim();
  const kanal = (f.kanal ?? '').trim();

  return {
    ok: true,
    data: {
      site,
      product: (f.product ?? '').trim() || null,
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
