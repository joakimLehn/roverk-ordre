import { describe, it, expect } from 'vitest';
import { BUILD_STATUSES, BUILD_STATUS_LABELS, isBuildStatus } from '@/lib/status';

describe('status', () => {
  it('har fire byggstatuser i riktig rekkefølge', () => {
    expect(BUILD_STATUSES).toEqual(['ny', 'under_bygging', 'bygd', 'montert']);
  });
  it('har norsk label for hver status', () => {
    expect(BUILD_STATUS_LABELS.under_bygging).toBe('Under bygging');
    for (const s of BUILD_STATUSES) expect(BUILD_STATUS_LABELS[s]).toBeTruthy();
  });
  it('godtar kun kjente statuser', () => {
    expect(isBuildStatus('montert')).toBe(true);
    expect(isBuildStatus('slettet')).toBe(false);
    expect(isBuildStatus('')).toBe(false);
    expect(isBuildStatus(null)).toBe(false);
  });
});
