import { KANALER } from './manual-order';
import { normalizeEmail } from './email';

export type InspectionStatus = 'aktiv' | 'gjennomfort' | 'avlyst';
export type InspectionProduct = 'skjul' | 'ved' | 'orden' | 'annet';
export type InspectionFileKind = 'bilde' | 'pdf' | 'epost';
export type InspectionViewKey = 'kommende' | 'ferdig' | 'alle';

export interface Inspection {
  id: string;
  created_at: string;
  created_by: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  scheduled_on: string | null;   // YYYY-MM-DD
  scheduled_time: string | null; // HH:MM
  status: InspectionStatus;
  product: InspectionProduct | null;
  channel: string | null;
  notes: string | null;
  updated_at: string;
  file_count: number; // 0 i ren parse; settes av db-laget senere
}

export interface InspectionInput {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  scheduled_on: string | null;
  scheduled_time: string | null;
  status: InspectionStatus;
  product: InspectionProduct | null;
  channel: string | null;
  notes: string | null;
  file_count: 0;
}

export type InspectionParseResult =
  | { ok: true; data: InspectionInput }
  | { ok: false; error: string };

export const INSPECTION_STATUSES: InspectionStatus[] = ['aktiv', 'gjennomfort', 'avlyst'];

export const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  aktiv: 'Aktiv',
  gjennomfort: 'Gjennomført',
  avlyst: 'Avlyst',
};

export function isInspectionStatus(v: unknown): v is InspectionStatus {
  return typeof v === 'string' && (INSPECTION_STATUSES as string[]).includes(v);
}

export const INSPECTION_PRODUCTS: InspectionProduct[] = ['skjul', 'ved', 'orden', 'annet'];

export const INSPECTION_PRODUCT_LABELS: Record<InspectionProduct, string> = {
  skjul: 'Skjul',
  ved: 'Ved',
  orden: 'Orden',
  annet: 'Annet',
};

export function isInspectionProduct(v: unknown): v is InspectionProduct {
  return typeof v === 'string' && (INSPECTION_PRODUCTS as string[]).includes(v);
}

export const INSPECTION_VIEWS: { key: InspectionViewKey; label: string }[] = [
  { key: 'kommende', label: 'Kommende' },
  { key: 'ferdig', label: 'Ferdig' },
  { key: 'alle', label: 'Alle' },
];

export function isInspectionViewKey(v: unknown): v is InspectionViewKey {
  return v === 'kommende' || v === 'ferdig' || v === 'alle';
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const INSPECTION_ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'application/pdf',
] as const;

export const INSPECTION_MAX_FILE_BYTES = 15 * 1024 * 1024;
export const INSPECTION_MAX_FILES = 40;
export const INSPECTION_MAX_EMAIL_CHARS = 50_000;

const IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

export function parseInspection(f: Record<string, string>): InspectionParseResult {
  const name = (f.name ?? '').trim();
  if (!name) return { ok: false, error: 'Kundenavn er påkrevd.' };

  const emailRaw = (f.email ?? '').trim();
  const email = emailRaw ? normalizeEmail(emailRaw) : null;
  if (emailRaw && !email) return { ok: false, error: 'Ugyldig e-postadresse.' };

  const scheduled_on_raw = (f.scheduled_on ?? '').trim();
  let scheduled_on: string | null = null;
  if (scheduled_on_raw) {
    if (!ISO_DATE_RE.test(scheduled_on_raw)) return { ok: false, error: 'Ugyldig dato.' };
    scheduled_on = scheduled_on_raw;
  }

  const scheduled_time_raw = (f.scheduled_time ?? '').trim();
  let scheduled_time: string | null = null;
  if (scheduled_time_raw) {
    if (!TIME_RE.test(scheduled_time_raw)) return { ok: false, error: 'Ugyldig klokkeslett.' };
    if (!scheduled_on) return { ok: false, error: 'Klokkeslett krever avtalt dato.' };
    scheduled_time = scheduled_time_raw;
  }

  const productRaw = (f.product ?? '').trim();
  if (productRaw && !isInspectionProduct(productRaw)) {
    return { ok: false, error: 'Ukjent produkt.' };
  }
  const product = productRaw ? (productRaw as InspectionProduct) : null;

  const channelRaw = (f.channel ?? '').trim();
  if (channelRaw && !(KANALER as readonly string[]).includes(channelRaw)) {
    return { ok: false, error: 'Ukjent kanal.' };
  }
  const channel = channelRaw || null;

  const statusRaw = (f.status ?? '').trim();
  if (statusRaw && !isInspectionStatus(statusRaw)) {
    return { ok: false, error: 'Ukjent status.' };
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
      status: statusRaw ? (statusRaw as InspectionStatus) : 'aktiv',
      product,
      channel,
      notes: (f.notes ?? '').trim() || null,
      file_count: 0,
    },
  };
}

export function applyInspectionView(items: Inspection[], view: InspectionViewKey): Inspection[] {
  if (view === 'kommende') return items.filter((i) => i.status === 'aktiv');
  if (view === 'ferdig') {
    return items.filter((i) => i.status === 'gjennomfort' || i.status === 'avlyst');
  }
  return items;
}

export function inspectionViewCounts(items: Inspection[]): Record<InspectionViewKey, number> {
  return {
    kommende: applyInspectionView(items, 'kommende').length,
    ferdig: applyInspectionView(items, 'ferdig').length,
    alle: items.length,
  };
}

export function searchInspections(items: Inspection[], q: string): Inspection[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return items;
  return items.filter((i) =>
    [i.name, i.phone, i.email, i.address].some((v) => (v ?? '').toLowerCase().includes(needle)),
  );
}

/**
 * Lenka til en visning, med søk i behold. Kommende er standard og får ingen
 * `vis=`-parameter. `view` droppes bevisst – det er ordrelistas nøkkel.
 */
export function inspectionViewHref(
  view: InspectionViewKey,
  params: Record<string, string | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v && k !== 'vis' && k !== 'view') sp.set(k, v);
  }
  if (view !== 'kommende') sp.set('vis', view);
  const q = sp.toString();
  return q ? `/befaringer?${q}` : '/befaringer';
}

const whenDateFormatter = new Intl.DateTimeFormat('nb-NO', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

export function formatInspectionWhen(
  on: string | null,
  time: string | null,
  todayYmd: string,
): string {
  if (!on) return 'Ikke avtalt';
  const clock = time ? ` kl. ${time}` : '';
  if (on === todayYmd) return `i dag${clock}`;
  const label = whenDateFormatter.format(new Date(`${on}T12:00:00Z`)).replace(/[  ]/g, ' ');
  return `${label}${clock}`;
}

export function kindFromContentType(contentType: string): Exclude<InspectionFileKind, 'epost'> | null {
  const mime = contentType.trim().toLowerCase().split(';')[0] ?? '';
  if (mime === 'application/pdf') return 'pdf';
  if (IMAGE_MIME.has(mime)) return 'bilde';
  return null;
}

export function validateInspectionFile(input: {
  contentType: string;
  byteSize: number;
}): { ok: true; kind: 'bilde' | 'pdf' } | { ok: false; error: string } {
  const kind = kindFromContentType(input.contentType);
  if (!kind) return { ok: false, error: 'Filtypen er ikke tillatt.' };
  if (!Number.isFinite(input.byteSize) || input.byteSize < 0) {
    return { ok: false, error: 'Ugyldig filstørrelse.' };
  }
  if (input.byteSize > INSPECTION_MAX_FILE_BYTES) {
    return { ok: false, error: 'Filen er for stor. Maks 15 MB.' };
  }
  return { ok: true, kind };
}

export function validateInspectionFileCount(
  current: number,
  adding: number,
): { ok: true } | { ok: false; error: string } {
  if (current + adding > INSPECTION_MAX_FILES) {
    return { ok: false, error: 'For mange filer. Maks 40 per befaring.' };
  }
  return { ok: true };
}

export interface InspectionEmailExcerpt {
  kind: 'epost';
  subject: string | null;
  body_text: string;
  blob_pathname: null;
}

export function parseInspectionEmailExcerpt(
  f: Record<string, string>,
): { ok: true; data: InspectionEmailExcerpt } | { ok: false; error: string } {
  const body_text = (f.body_text ?? '').trim();
  if (!body_text) return { ok: false, error: 'E-postutdrag mangler innhold.' };
  if (body_text.length > INSPECTION_MAX_EMAIL_CHARS) {
    return { ok: false, error: 'E-postutdraget er for langt.' };
  }
  return {
    ok: true,
    data: {
      kind: 'epost',
      subject: (f.subject ?? '').trim() || null,
      body_text,
      blob_pathname: null,
    },
  };
}
