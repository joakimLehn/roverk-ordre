import { describe, it, expect } from 'vitest';
import {
  isOrderBlobPath,
  orderBlobPrefix,
  orderFileHref,
  parseOrderUploadRequest,
  toClientOrderFileView,
} from '@/lib/order-file';

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
