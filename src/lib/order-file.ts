export type OrderFileKind = 'bilde' | 'pdf';

export interface OrderFile {
  id: string;
  order_id: string;
  created_at: string;
  created_by: string | null;
  kind: OrderFileKind;
  filename: string;
  content_type: string | null;
  byte_size: number | null;
  /** Alltid satt – ordrevedlegg har ikke kind=epost. */
  blob_pathname: string;
}

/** Klientvisning uten blob-sti – den skal ikke lekke i HTML. */
export type OrderFileView = Omit<OrderFile, 'blob_pathname'>;

export type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * orders.id eies av nettsiden; vi behandler den som ugjennomsiktig streng.
 * Avvis tom, `/` og `..` – ikke gjett UUID. Eksistens sjekkes med getOrder senere.
 */
export function isUsableOrderId(orderId: string): boolean {
  return orderId.length > 0 && !orderId.includes('/') && !orderId.includes('..');
}

export function orderBlobPrefix(orderId: string): string {
  return `orders/${orderId}/`;
}

export function orderFileHref(orderId: string, fileId: string): string {
  return `/ordre/${orderId}/filer/${fileId}`;
}

export function toClientOrderFileView(file: OrderFile): OrderFileView {
  return {
    id: file.id,
    order_id: file.order_id,
    created_at: file.created_at,
    created_by: file.created_by,
    kind: file.kind,
    filename: file.filename,
    content_type: file.content_type,
    byte_size: file.byte_size,
  };
}

export function isOrderBlobPath(orderId: string, pathname: string): boolean {
  if (!isUsableOrderId(orderId) || pathname.includes('..')) return false;
  const prefix = orderBlobPrefix(orderId);
  return pathname.startsWith(prefix) && pathname.length > prefix.length;
}

export function parseOrderUploadRequest(
  pathname: string,
  clientPayload: string | null,
): ParseResult<{ orderId: string }> {
  if (!clientPayload) return { ok: false, error: 'Mangler ordre.' };
  let orderId = '';
  try {
    const parsed = JSON.parse(clientPayload) as { orderId?: unknown };
    orderId = typeof parsed.orderId === 'string' ? parsed.orderId : '';
  } catch {
    return { ok: false, error: 'Ugyldig opplastingsforespørsel.' };
  }
  if (!isUsableOrderId(orderId)) return { ok: false, error: 'Ugyldig ordre.' };
  if (!isOrderBlobPath(orderId, pathname)) {
    return { ok: false, error: 'Ugyldig filsti.' };
  }
  return { ok: true, data: { orderId } };
}
