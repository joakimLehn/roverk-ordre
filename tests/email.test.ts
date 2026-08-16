import { describe, it, expect } from 'vitest';
import { normalizeEmail } from '@/lib/email';

describe('normalizeEmail', () => {
  it('trimmer og lowercaser', () => {
    expect(normalizeEmail('  Ola@Snekker.NO ')).toBe('ola@snekker.no');
  });
  it('avviser ugyldig e-post', () => {
    expect(normalizeEmail('ikke-epost')).toBeNull();
    expect(normalizeEmail('')).toBeNull();
    expect(normalizeEmail('a @b.no')).toBeNull();
  });
});
