import type { BuildStatus } from '@/lib/types';
import { BUILD_STATUS_LABELS } from '@/lib/status';

const STYLES: Record<BuildStatus, string> = {
  ny: 'bg-warn-bg text-warn',
  under_bygging: 'bg-info-bg text-info',
  bygd: 'bg-line text-ink',
  montert: 'bg-ok-bg text-ok',
};

export function StatusBadge({ status }: { status: BuildStatus }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${STYLES[status]}`}>
      {BUILD_STATUS_LABELS[status]}
    </span>
  );
}

export function TestBadge() {
  return (
    <span className="inline-block rounded-full bg-danger-bg px-2.5 py-0.5 text-[11.5px] font-bold text-danger">
      TEST
    </span>
  );
}
