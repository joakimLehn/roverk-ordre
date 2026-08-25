import { describe, expect, it } from 'vitest';
import { appSectionFromPath } from '@/lib/section';

describe('appSectionFromPath', () => {
  it('kjenner befaringslista og undersidene som Befaringer', () => {
    expect(appSectionFromPath('/befaringer')).toBe('befaringer');
    expect(appSectionFromPath('/befaringer/ny')).toBe('befaringer');
    expect(appSectionFromPath('/befaringer/abc-123')).toBe('befaringer');
  });

  it('teller alt utenfor /befaringer som Ordrer', () => {
    expect(appSectionFromPath('/')).toBe('ordrer');
    expect(appSectionFromPath('/ordre/ny')).toBe('ordrer');
    expect(appSectionFromPath('/ordre/abc')).toBe('ordrer');
    expect(appSectionFromPath('/login')).toBe('ordrer');
    expect(appSectionFromPath('/befaring')).toBe('ordrer');
    expect(appSectionFromPath('')).toBe('ordrer');
  });
});
