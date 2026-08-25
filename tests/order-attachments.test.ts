import { describe, expect, it } from 'vitest';
import { formatOrderFileMeta } from '@/lib/order-file';
import { MAX_FILE_BYTES, clientUploadError } from '@/lib/upload';

describe('ordrevedlegg på detaljsiden', () => {
  it('lightbox-meta viser dato og hvem som lastet opp', () => {
    const meta = formatOrderFileMeta('2026-08-14T12:00:00.000Z', 'ola@roverk.no');
    expect(meta).toBe('14. aug. 2026 · ola@roverk.no');
  });

  it('avviser for stor fil på klienten før Blob', () => {
    expect(
      clientUploadError({ size: MAX_FILE_BYTES + 1, type: 'image/jpeg' }),
    ).toBe('too-large');
  });
});
