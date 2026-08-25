import type { BuildStatus } from '@/lib/types';
import { BUILD_STATUS_LABELS } from '@/lib/status';
import {
  INSPECTION_STATUS_LABELS,
  type InspectionStatus,
} from '@/lib/inspection';

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

const INSPECTION_STYLES: Record<InspectionStatus, string> = {
  aktiv: 'bg-info-bg text-info',
  gjennomfort: 'bg-ok-bg text-ok',
  avlyst: 'bg-sand text-muted',
};

/** Visningsbrikke. Lista åpner ikke sheet – det gjør detaljsiden. */
export function InspectionStatusBadge({ status }: { status: InspectionStatus }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${INSPECTION_STYLES[status]}`}>
      {INSPECTION_STATUS_LABELS[status]}
    </span>
  );
}
