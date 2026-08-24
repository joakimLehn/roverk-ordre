import { normalizeEmail } from './email';
import { KANALER } from './manual-order';

export const INSPECTION_PRODUCTS = ['skjul', 'ved', 'orden', 'annet'] as const;
export type InspectionProduct = (typeof INSPECTION_PRODUCTS)[number];

export const INSPECTION_PRODUCT_LABELS: Record<InspectionProduct, string> = {
  skjul: 'Skjul',
  ved: 'Ved',
  orden: 'Orden',
  annet: 'Annet',
};

export interface InspectionInput {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  scheduled_on: string | null;
  scheduled_time: string | null;
  product: InspectionProduct | null;
  channel: string | null;
  notes: string | null;
}

export type InspectionParseResult =
  | { ok: true; data: InspectionInput }
  | { ok: false; error: string };

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** HTML time kan sende HH:MM eller HH:MM:SS. Vi lagrer HH:MM. */
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

export function parseInspection(f: Record<string, string>): InspectionParseResult {
  const name = (f.name ?? '').trim();
  if (!name) return { ok: false, error: 'Navn er påkrevd.' };

  const emailRaw = (f.email ?? '').trim();
  const email = emailRaw ? normalizeEmail(emailRaw) : null;
  if (emailRaw && !email) return { ok: false, error: 'Ugyldig e-postadresse.' };

  const scheduled_on_raw = (f.scheduled_on ?? '').trim();
  let scheduled_on: string | null = null;
  if (scheduled_on_raw) {
    if (!ISO_DATE_RE.test(scheduled_on_raw)) {
      return { ok: false, error: 'Ugyldig dato.' };
    }
    scheduled_on = scheduled_on_raw;
  }

  const scheduled_time_raw = (f.scheduled_time ?? '').trim();
  let scheduled_time: string | null = null;
  if (scheduled_time_raw) {
    if (!TIME_RE.test(scheduled_time_raw)) {
      return { ok: false, error: 'Ugyldig klokkeslett.' };
    }
    if (!scheduled_on) {
      return { ok: false, error: 'Klokkeslett uten dato er ugyldig.' };
    }
    scheduled_time = scheduled_time_raw.slice(0, 5);
  }

  const productRaw = (f.product ?? '').trim();
  let product: InspectionProduct | null = null;
  if (productRaw) {
    if (!(INSPECTION_PRODUCTS as readonly string[]).includes(productRaw)) {
      return { ok: false, error: 'Ukjent produkt.' };
    }
    product = productRaw as InspectionProduct;
  }

  const channelRaw = (f.kanal ?? f.channel ?? '').trim();
  let channel: string | null = null;
  if (channelRaw) {
    if (!(KANALER as readonly string[]).includes(channelRaw)) {
      return { ok: false, error: 'Ukjent kanal.' };
    }
    channel = channelRaw;
  }

  return {
    ok: true,
    data: {
      name,
      phone: (f.phone ?? '').trim() || null,
      email,
      address: (f.address ?? '').trim() || null,
      scheduled_on,
      scheduled_time,
      product,
      channel,
      notes: (f.notes ?? '').trim() || null,
    },
  };
}
