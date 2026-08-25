export type UploadFileKind = 'bilde' | 'pdf';
export type UploadEntity = 'befaring' | 'ordre';

export const ALLOWED_UPLOAD_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'application/pdf',
] as const;

export const MAX_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_FILES = 40;

const IMAGE_MIME: ReadonlySet<string> = new Set(
  ALLOWED_UPLOAD_MIME.filter((m) => m !== 'application/pdf'),
);

const RENDERABLE_IMAGE = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export function kindFromContentType(contentType: string): UploadFileKind | null {
  const mime = contentType.trim().toLowerCase().split(';')[0] ?? '';
  if (mime === 'application/pdf') return 'pdf';
  if (IMAGE_MIME.has(mime)) return 'bilde';
  return null;
}

export function validateUploadFile(input: {
  contentType: string;
  byteSize: number;
}): { ok: true; kind: UploadFileKind } | { ok: false; error: string } {
  const kind = kindFromContentType(input.contentType);
  if (!kind) return { ok: false, error: 'Filtypen er ikke tillatt.' };
  if (!Number.isFinite(input.byteSize) || input.byteSize < 0) {
    return { ok: false, error: 'Ugyldig filstørrelse.' };
  }
  if (input.byteSize > MAX_FILE_BYTES) {
    return { ok: false, error: 'Filen er for stor. Maks 15 MB.' };
  }
  return { ok: true, kind };
}

export function validateUploadFileCount(
  current: number,
  adding: number,
  entity: UploadEntity,
): { ok: true } | { ok: false; error: string } {
  if (current + adding > MAX_FILES) {
    return { ok: false, error: `For mange filer. Maks 40 per ${entity}.` };
  }
  return { ok: true };
}

export function isRenderableImage(contentType: string | null | undefined, filename?: string): boolean {
  const type = (contentType ?? '').split(';')[0].trim().toLowerCase();
  if (RENDERABLE_IMAGE.has(type)) return true;
  if (type === 'image/heic' || type === 'image/heif') return false;
  const name = (filename ?? '').toLowerCase();
  if (name.endsWith('.heic') || name.endsWith('.heif')) return false;
  return false;
}

/**
 * Slett Blob først, deretter DB-raden. Feilet blob-slett skal ikke stoppe
 * rad-slett – en orphan blob er bedre enn en rad som peker på noe som er borte.
 */
export async function deleteBlobThenRecord(opts: {
  blobPathname: string | null;
  deleteBlob: (pathname: string) => Promise<void>;
  deleteRecord: () => Promise<void>;
}): Promise<void> {
  if (opts.blobPathname) {
    try {
      await opts.deleteBlob(opts.blobPathname);
    } catch {
      // best-effort
    }
  }
  await opts.deleteRecord();
}

/**
 * Klient-sjekk før Blob-opplasting. Tom `type` avvises ikke – iOS/Android
 * sender ofte blank MIME, og serveren validerer på nytt.
 */
export function clientUploadError(file: { size: number; type: string }): 'too-large' | 'bad-type' | null {
  if (file.size > MAX_FILE_BYTES) return 'too-large';
  if (file.type) {
    const kind = kindFromContentType(file.type);
    if (kind !== 'bilde' && kind !== 'pdf') return 'bad-type';
  }
  return null;
}
