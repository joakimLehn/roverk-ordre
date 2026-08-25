import type { InspectionFileKind } from './inspection';

export type { InspectionFileKind };
export { deleteBlobThenRecord, isRenderableImage } from './upload';

export interface InspectionFile {
  id: string;
  inspection_id: string;
  created_at: string;
  created_by: string | null;
  kind: InspectionFileKind;
  filename: string;
  content_type: string | null;
  byte_size: number | null;
  blob_pathname: string | null;
  subject: string | null;
  body_text: string | null;
}

/** Klientvisning uten blob-sti – den skal ikke lekke i HTML. */
export type InspectionFileView = Omit<InspectionFile, 'blob_pathname'>;

export type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isInspectionId(id: string): boolean {
  return UUID_RE.test(id);
}

export function inspectionBlobPrefix(inspectionId: string): string {
  return `inspections/${inspectionId}/`;
}

export function inspectionFileHref(inspectionId: string, fileId: string): string {
  return `/befaringer/${inspectionId}/filer/${fileId}`;
}

export function toClientFileView(file: InspectionFile): InspectionFileView {
  return {
    id: file.id,
    inspection_id: file.inspection_id,
    created_at: file.created_at,
    created_by: file.created_by,
    kind: file.kind,
    filename: file.filename,
    content_type: file.content_type,
    byte_size: file.byte_size,
    subject: file.subject,
    body_text: file.body_text,
  };
}

export function isInspectionBlobPath(inspectionId: string, pathname: string): boolean {
  if (!isInspectionId(inspectionId)) return false;
  const prefix = inspectionBlobPrefix(inspectionId);
  return pathname.startsWith(prefix) && pathname.length > prefix.length && !pathname.includes('..');
}

export function parseInspectionUploadRequest(
  pathname: string,
  clientPayload: string | null,
): ParseResult<{ inspectionId: string }> {
  if (!clientPayload) return { ok: false, error: 'Mangler befaring.' };
  let inspectionId = '';
  try {
    const parsed = JSON.parse(clientPayload) as { inspectionId?: unknown };
    inspectionId = typeof parsed.inspectionId === 'string' ? parsed.inspectionId : '';
  } catch {
    return { ok: false, error: 'Ugyldig opplastingsforespørsel.' };
  }
  if (!isInspectionId(inspectionId)) return { ok: false, error: 'Ugyldig befaring.' };
  if (!isInspectionBlobPath(inspectionId, pathname)) {
    return { ok: false, error: 'Ugyldig filsti.' };
  }
  return { ok: true, data: { inspectionId } };
}

/**
 * Slett alle blobs best-effort, deretter SQL (cascade). Feilet blob-slett
 * er ikke brukersynlig hvis raden er borte.
 */
export async function deleteInspectionBlobsThenRecord(opts: {
  blobPathnames: string[];
  deleteBlobs: (pathnames: string[]) => Promise<void>;
  deleteRecord: () => Promise<void>;
}): Promise<void> {
  const pathnames = opts.blobPathnames.filter(Boolean);
  if (pathnames.length > 0) {
    try {
      await opts.deleteBlobs(pathnames);
    } catch {
      // best-effort
    }
  }
  await opts.deleteRecord();
}
