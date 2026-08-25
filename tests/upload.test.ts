import { describe, expect, it, vi } from 'vitest';
import {
  INSPECTION_ALLOWED_MIME,
  INSPECTION_MAX_FILE_BYTES,
  INSPECTION_MAX_FILES,
  validateInspectionFile,
  validateInspectionFileCount,
} from '@/lib/inspection';
import {
  ALLOWED_UPLOAD_MIME,
  MAX_FILE_BYTES,
  MAX_FILES,
  clientUploadError,
  deleteBlobThenRecord,
  isRenderableImage,
  kindFromContentType,
  validateUploadFile,
  validateUploadFileCount,
} from '@/lib/upload';

describe('MIME og kind', () => {
  it('mapper kjent MIME til kind og avviser resten', () => {
    expect(kindFromContentType('image/jpeg')).toBe('bilde');
    expect(kindFromContentType('image/png')).toBe('bilde');
    expect(kindFromContentType('image/webp')).toBe('bilde');
    expect(kindFromContentType('image/gif')).toBe('bilde');
    expect(kindFromContentType('image/heic')).toBe('bilde');
    expect(kindFromContentType('image/heif')).toBe('bilde');
    expect(kindFromContentType('application/pdf')).toBe('pdf');
    expect(kindFromContentType('application/zip')).toBeNull();
    expect(kindFromContentType('image/svg+xml')).toBeNull();
    expect(kindFromContentType('video/mp4')).toBeNull();
    expect(kindFromContentType('text/plain')).toBeNull();
  });

  it('striper charset og ignorerer store bokstaver', () => {
    expect(kindFromContentType('IMAGE/JPEG; charset=binary')).toBe('bilde');
    expect(kindFromContentType('Application/PDF;charset=utf-8')).toBe('pdf');
  });
});

describe('validateUploadFile', () => {
  it('godtar fil på maksstørrelse', () => {
    const jpeg = validateUploadFile({
      contentType: 'image/jpeg',
      byteSize: MAX_FILE_BYTES,
    });
    expect(jpeg).toEqual({ ok: true, kind: 'bilde' });

    const pdf = validateUploadFile({
      contentType: 'application/pdf',
      byteSize: 0,
    });
    expect(pdf).toEqual({ ok: true, kind: 'pdf' });
  });

  it('avviser feil type, ugyldig størrelse og over 15 MB', () => {
    const mime = validateUploadFile({ contentType: 'video/mp4', byteSize: 100 });
    expect(mime).toEqual({ ok: false, error: 'Filtypen er ikke tillatt.' });

    const zip = validateUploadFile({ contentType: 'application/zip', byteSize: 100 });
    expect(zip.ok).toBe(false);

    const svg = validateUploadFile({ contentType: 'image/svg+xml', byteSize: 100 });
    expect(svg.ok).toBe(false);

    const nan = validateUploadFile({ contentType: 'image/jpeg', byteSize: Number.NaN });
    expect(nan).toEqual({ ok: false, error: 'Ugyldig filstørrelse.' });

    const negativ = validateUploadFile({ contentType: 'image/jpeg', byteSize: -1 });
    expect(negativ).toEqual({ ok: false, error: 'Ugyldig filstørrelse.' });

    const stor = validateUploadFile({
      contentType: 'application/pdf',
      byteSize: MAX_FILE_BYTES + 1,
    });
    expect(stor).toEqual({ ok: false, error: 'Filen er for stor. Maks 15 MB.' });
  });
});

describe('validateUploadFileCount', () => {
  it('godtar inntil 40 filer', () => {
    expect(validateUploadFileCount(39, 1, 'befaring')).toEqual({ ok: true });
    expect(validateUploadFileCount(0, MAX_FILES, 'ordre')).toEqual({ ok: true });
  });

  it('avviser over 40 og bruker entity i feilteksten', () => {
    const befaring = validateUploadFileCount(MAX_FILES, 1, 'befaring');
    expect(befaring.ok).toBe(false);
    if (!befaring.ok) expect(befaring.error).toBe('For mange filer. Maks 40 per befaring.');

    const ordre = validateUploadFileCount(40, 1, 'ordre');
    expect(ordre.ok).toBe(false);
    if (!ordre.ok) expect(ordre.error).toContain('per ordre');

    expect(validateUploadFileCount(38, 3, 'ordre').ok).toBe(false);
  });
});

describe('isRenderableImage', () => {
  it('jpeg/png/webp/gif renderer, heic/heif gjør det ikke', () => {
    expect(isRenderableImage('image/jpeg')).toBe(true);
    expect(isRenderableImage('image/png')).toBe(true);
    expect(isRenderableImage('image/webp')).toBe(true);
    expect(isRenderableImage('image/gif')).toBe(true);
    expect(isRenderableImage('image/heic')).toBe(false);
    expect(isRenderableImage('image/heif', 'bilde.HEIC')).toBe(false);
    expect(isRenderableImage(null, 'fasade.heif')).toBe(false);
    expect(isRenderableImage('application/pdf')).toBe(false);
  });
});

describe('deleteBlobThenRecord', () => {
  it('sletter blob og deretter raden', async () => {
    const deleteBlob = vi.fn().mockResolvedValue(undefined);
    const deleteRecord = vi.fn().mockResolvedValue(undefined);
    await deleteBlobThenRecord({
      blobPathname: 'orders/x/a.jpg',
      deleteBlob,
      deleteRecord,
    });
    expect(deleteBlob).toHaveBeenCalledWith('orders/x/a.jpg');
    expect(deleteRecord).toHaveBeenCalledOnce();
    expect(deleteBlob.mock.invocationCallOrder[0]).toBeLessThan(
      deleteRecord.mock.invocationCallOrder[0]!,
    );
  });

  it('sletter raden selv om blob-slett feiler', async () => {
    const deleteBlob = vi.fn().mockRejectedValue(new Error('blob nede'));
    const deleteRecord = vi.fn().mockResolvedValue(undefined);
    await deleteBlobThenRecord({
      blobPathname: 'inspections/x/a.jpg',
      deleteBlob,
      deleteRecord,
    });
    expect(deleteRecord).toHaveBeenCalledOnce();
  });

  it('lar DB-feil boble opp', async () => {
    const deleteRecord = vi.fn().mockRejectedValue(new Error('db nede'));
    await expect(
      deleteBlobThenRecord({
        blobPathname: null,
        deleteBlob: vi.fn(),
        deleteRecord,
      }),
    ).rejects.toThrow('db nede');
  });
});

describe('inspection-alias', () => {
  it('peker inspection-konstantene på samme verdier', () => {
    expect(INSPECTION_ALLOWED_MIME).toBe(ALLOWED_UPLOAD_MIME);
    expect(INSPECTION_MAX_FILE_BYTES).toBe(MAX_FILE_BYTES);
    expect(INSPECTION_MAX_FILES).toBe(MAX_FILES);
  });

  it('wrapper filvalidering mot befaring', () => {
    const ok = validateInspectionFile({
      contentType: 'image/jpeg',
      byteSize: INSPECTION_MAX_FILE_BYTES,
    });
    expect(ok).toEqual(validateUploadFile({ contentType: 'image/jpeg', byteSize: MAX_FILE_BYTES }));

    const count = validateInspectionFileCount(INSPECTION_MAX_FILES, 1);
    expect(count).toEqual(validateUploadFileCount(MAX_FILES, 1, 'befaring'));
    expect(count.ok).toBe(false);
    if (!count.ok) expect(count.error).toContain('per befaring');
  });
});

describe('clientUploadError', () => {
  it('godtar jpeg under grensen', () => {
    expect(clientUploadError({ size: 1024, type: 'image/jpeg' })).toBeNull();
  });

  it('avviser fil over 15 MB', () => {
    expect(clientUploadError({ size: MAX_FILE_BYTES + 1, type: 'image/jpeg' })).toBe('too-large');
  });
});
