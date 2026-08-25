import { describe, it, expect, vi } from 'vitest';
import {
  authorizeOrderUpload,
  canServeOrderFile,
  isOrderBlobPath,
  orderBlobPrefix,
  orderFileDisplayName,
  orderFileHref,
  parseOrderUploadRequest,
  toClientOrderFileView,
  validateOrderFileInsert,
} from '@/lib/order-file';
import { MAX_FILES } from '@/lib/upload';

describe('orderBlobPrefix', () => {
  it('bygger prefiks under orders/', () => {
    expect(orderBlobPrefix('abc')).toBe('orders/abc/');
  });
});

describe('parseOrderUploadRequest', () => {
  const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('godtar matching sti og payload', () => {
    const r = parseOrderUploadRequest(
      `orders/${id}/levering.jpg`,
      JSON.stringify({ orderId: id }),
    );
    expect(r).toEqual({ ok: true, data: { orderId: id } });
  });

  it('godtar ugjennomsiktig id som ikke er UUID', () => {
    const opaque = 'ord-42';
    const r = parseOrderUploadRequest(
      `orders/${opaque}/levering.jpg`,
      JSON.stringify({ orderId: opaque }),
    );
    expect(r).toEqual({ ok: true, data: { orderId: opaque } });
  });

  it('avviser sti som tilhører en annen ordre', () => {
    const other = '11111111-2222-3333-4444-555555555555';
    const r = parseOrderUploadRequest(
      `orders/${other}/levering.jpg`,
      JSON.stringify({ orderId: id }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/filsti/i);
  });

  it('avviser .. i orderId', () => {
    const r = parseOrderUploadRequest(
      'orders/../hemmelig.jpg',
      JSON.stringify({ orderId: '..' }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/ordre/i);
  });

  it('avviser / i orderId', () => {
    const r = parseOrderUploadRequest(
      'orders/foo/bar/levering.jpg',
      JSON.stringify({ orderId: 'foo/bar' }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/ordre/i);
  });

  it('avviser manglende payload', () => {
    const r = parseOrderUploadRequest(`orders/${id}/levering.jpg`, null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/mangler/i);
  });

  it('avviser ugyldig JSON', () => {
    const r = parseOrderUploadRequest(`orders/${id}/levering.jpg`, '{nei');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/opplastingsforespørsel/i);
  });

  it('avviser tom orderId', () => {
    const r = parseOrderUploadRequest('orders//levering.jpg', JSON.stringify({ orderId: '' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/ordre/i);
  });
});

describe('isOrderBlobPath', () => {
  it('avviser pathname med .. utenfor id-delen', () => {
    expect(isOrderBlobPath('abc', 'orders/abc/../hemmelig.jpg')).toBe(false);
  });

  it('avviser sti som bare er prefikset', () => {
    expect(isOrderBlobPath('abc', 'orders/abc/')).toBe(false);
  });
});

describe('orderFileHref', () => {
  it('bygger autentisert fil-rute uten blob-url', () => {
    expect(orderFileHref('a', 'b')).toBe('/ordre/a/filer/b');
  });
});

describe('authorizeOrderUpload', () => {
  const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const pathname = `orders/${id}/levering.jpg`;
  const payload = JSON.stringify({ orderId: id });

  it('godtar eksisterende ordre med plass', async () => {
    const r = await authorizeOrderUpload(pathname, payload, {
      getOrder: async () => ({ id }),
      countOrderFiles: async () => 3,
    });
    expect(r).toEqual({ ok: true, data: { orderId: id } });
  });

  it('avviser manglende ordre uten å telle filer', async () => {
    const countOrderFiles = vi.fn();
    const r = await authorizeOrderUpload(pathname, payload, {
      getOrder: async () => null,
      countOrderFiles,
    });
    expect(r).toEqual({ ok: false, error: 'Fant ikke ordren.' });
    expect(countOrderFiles).not.toHaveBeenCalled();
  });
});

describe('validateOrderFileInsert', () => {
  const orderId = 'ord-42';

  it('godtar jpeg under ordreprefikset', () => {
    const r = validateOrderFileInsert({
      orderId,
      pathname: `orders/${orderId}/levering.jpg`,
      contentType: 'image/jpeg',
      byteSize: 1200,
      currentFileCount: 0,
    });
    expect(r).toEqual({ ok: true, kind: 'bilde' });
  });

  it('avviser feil type, full kvote og sti utenfor ordren', () => {
    const mime = validateOrderFileInsert({
      orderId,
      pathname: `orders/${orderId}/film.mp4`,
      contentType: 'video/mp4',
      byteSize: 100,
      currentFileCount: 0,
    });
    expect(mime.ok).toBe(false);
    if (!mime.ok) expect(mime.error).toMatch(/filtypen/i);

    const full = validateOrderFileInsert({
      orderId,
      pathname: `orders/${orderId}/levering.jpg`,
      contentType: 'image/jpeg',
      byteSize: 100,
      currentFileCount: MAX_FILES,
    });
    expect(full.ok).toBe(false);
    if (!full.ok) expect(full.error).toContain('per ordre');

    const path = validateOrderFileInsert({
      orderId,
      pathname: 'inspections/x/fasade.jpg',
      contentType: 'image/jpeg',
      byteSize: 100,
      currentFileCount: 0,
    });
    expect(path.ok).toBe(false);
    if (!path.ok) expect(path.error).toMatch(/filsti/i);
  });
});

describe('orderFileDisplayName', () => {
  it('trimmer og faller tilbake til fil', () => {
    expect(orderFileDisplayName('  levering.jpg  ')).toBe('levering.jpg');
    expect(orderFileDisplayName('   ')).toBe('fil');
  });
});

describe('canServeOrderFile', () => {
  const file = {
    order_id: 'o1',
    blob_pathname: 'orders/o1/levering.jpg',
  };

  it('tillater fil som tilhører ordren', () => {
    expect(canServeOrderFile(file, 'o1')).toBe(true);
  });

  it('avviser manglende fil, annen ordre eller tom blob-sti', () => {
    expect(canServeOrderFile(null, 'o1')).toBe(false);
    expect(canServeOrderFile(file, 'annen')).toBe(false);
    expect(canServeOrderFile({ order_id: 'o1', blob_pathname: '' }, 'o1')).toBe(false);
  });
});

describe('toClientOrderFileView', () => {
  it('lar ikke blob_pathname følge med til klienten', () => {
    const view = toClientOrderFileView({
      id: 'f1',
      order_id: 'o1',
      created_at: '2026-08-25T00:00:00.000Z',
      created_by: null,
      kind: 'bilde',
      filename: 'levering.jpg',
      content_type: 'image/jpeg',
      byte_size: 12,
      blob_pathname: 'orders/o1/levering.jpg',
    });
    expect(view).not.toHaveProperty('blob_pathname');
    expect(view.filename).toBe('levering.jpg');
  });
});
