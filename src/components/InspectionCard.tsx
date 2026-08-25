import Link from 'next/link';
import type { Inspection } from '@/lib/inspection';
import { formatInspectionWhen, isInspectionOverdue } from '@/lib/inspection';
import { InspectionStatusBadge } from './Badge';

export function InspectionCard({ inspection: i, today }: { inspection: Inspection; today: string }) {
  const overdue = isInspectionOverdue(i, today);
  const cancelled = i.status === 'avlyst';
  const when = formatInspectionWhen(i.scheduled_on, i.scheduled_time, today);

  return (
    <Link
      href={`/befaringer/${i.id}`}
      className="focus-ring flex gap-3 overflow-hidden rounded-2xl border border-line bg-white px-3.5 py-3.5 active:bg-sand"
    >
      <div className="min-w-0 flex-1">
        <div className={`text-[15.5px] font-bold leading-tight ${cancelled ? 'text-muted' : ''}`}>
          {i.name}
        </div>
        <div className={`mt-1 text-[13.5px] ${cancelled ? 'text-muted' : ''}`}>
          {i.address || 'Mangler adresse'}
        </div>
        <div className={`mt-0.5 text-[13px] ${overdue ? 'font-bold text-danger' : 'text-muted'}`}>
          {when}
        </div>
        {i.file_count > 0 ? (
          <div className="mt-0.5 text-[12px] text-muted">
            {i.file_count} vedlegg
          </div>
        ) : null}
      </div>
      <div className="flex-none self-start">
        <InspectionStatusBadge status={i.status} />
      </div>
    </Link>
  );
}
