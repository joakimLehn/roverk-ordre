'use client';

import Link from 'next/link';
import type { Inspection } from '@/lib/inspection';
import { formatInspectionWhen, isInspectionOverdue } from '@/lib/inspection';
import { InspectionStatusChip } from './InspectionStatusChip';

export function InspectionCard({ inspection: i, today }: { inspection: Inspection; today: string }) {
  const overdue = isInspectionOverdue(i, today);
  const cancelled = i.status === 'avlyst';
  const when = formatInspectionWhen(i.scheduled_on, i.scheduled_time, today);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      {/* Kortkroppen er lenken. Statusbrikken ligger utenfor, ellers åpner
          trykk detaljsiden i stedet for sheet (hansker / nabotreff). */}
      <Link
        href={`/befaringer/${i.id}`}
        className="focus-ring flex gap-3 px-3.5 pb-2.5 pt-3.5 active:bg-sand"
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
      </Link>
      <div className="px-3.5 pb-3">
        <InspectionStatusChip inspectionId={i.id} name={i.name} current={i.status} />
      </div>
    </div>
  );
}
