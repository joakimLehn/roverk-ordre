import type { BuildStatus } from './types';

export const BUILD_STATUSES: BuildStatus[] = ['ny', 'under_bygging', 'bygd', 'montert'];

export const BUILD_STATUS_LABELS: Record<BuildStatus, string> = {
  ny: 'Ny',
  under_bygging: 'Under bygging',
  bygd: 'Bygd',
  montert: 'Montert',
};

export function isBuildStatus(v: unknown): v is BuildStatus {
  return typeof v === 'string' && (BUILD_STATUSES as string[]).includes(v);
}
