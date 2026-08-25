import { describe, it, expect, vi } from 'vitest';
import {
  parseInspectionUploadRequest,
  deleteBlobThenRecord,
  deleteInspectionBlobsThenRecord,
  inspectionFileHref,
  isRenderableImage,
  toClientFileView,
} from '@/lib/inspection-file';

describe('parseInspectionUploadRequest', () => {
  const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('godtar matching sti og payload', () => {
    const r = parseInspectionUploadRequest(
      `inspections/${id}/fasade.jpg`,
      JSON.stringify({ inspectionId: id }),
    );
    expect(r).toEqual({ ok: true, data: { inspectionId: id } });
  });

  it('avviser sti som ikke tilhører befaringen', () => {
    const other = '11111111-2222-3333-4444-555555555555';
    const r = parseInspectionUploadRequest(
      `inspections/${other}/fasade.jpg`,
      JSON.stringify({ inspectionId: id }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/filsti/i);
  });
});

describe('isRenderableImage', () => {
  it('jpeg renderer, heic gjør det ikke', () => {
    expect(isRenderableImage('image/jpeg')).toBe(true);
    expect(isRenderableImage('image/heic')).toBe(false);
    expect(isRenderableImage('image/heif', 'bilde.HEIC')).toBe(false);
  });
});

describe('inspectionFileHref', () => {
  it('bygger autentisert fil-rute uten blob-url', () => {
    expect(inspectionFileHref('a', 'b')).toBe('/befaringer/a/filer/b');
  });
});

describe('toClientFileView', () => {
  it('lar ikke blob_pathname følge med til klienten', () => {
    const view = toClientFileView({
      id: 'f1',
      inspection_id: 'i1',
      created_at: '2026-08-24T00:00:00.000Z',
      created_by: null,
      kind: 'bilde',
      filename: 'fasade.jpg',
      content_type: 'image/jpeg',
      byte_size: 12,
      blob_pathname: 'inspections/i1/fasade.jpg',
      subject: null,
      body_text: null,
    });
    expect(view).not.toHaveProperty('blob_pathname');
    expect(view.filename).toBe('fasade.jpg');
  });
});

describe('deleteBlobThenRecord', () => {
  it('sletter blob og deretter raden', async () => {
    const deleteBlob = vi.fn().mockResolvedValue(undefined);
    const deleteRecord = vi.fn().mockResolvedValue(undefined);
    await deleteBlobThenRecord({
      blobPathname: 'inspections/x/a.jpg',
      deleteBlob,
      deleteRecord,
    });
    expect(deleteBlob).toHaveBeenCalledWith('inspections/x/a.jpg');
    expect(deleteRecord).toHaveBeenCalledOnce();
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

describe('deleteInspectionBlobsThenRecord', () => {
  it('sletter raden selv om blob-slett feiler', async () => {
    const deleteBlobs = vi.fn().mockRejectedValue(new Error('blob nede'));
    const deleteRecord = vi.fn().mockResolvedValue(undefined);
    await deleteInspectionBlobsThenRecord({
      blobPathnames: ['inspections/x/a.jpg'],
      deleteBlobs,
      deleteRecord,
    });
    expect(deleteRecord).toHaveBeenCalledOnce();
  });
});
