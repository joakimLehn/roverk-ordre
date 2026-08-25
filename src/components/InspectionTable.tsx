'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Inspection } from '@/lib/inspection';
import { formatInspectionWhen, isInspectionOverdue } from '@/lib/inspection';
import { InspectionStatusBadge } from './Badge';

const td = 'border-b border-line px-3 py-2.5';

export function InspectionTable({
  inspections,
  today,
}: {
  inspections: Inspection[];
  today: string;
}) {
  const router = useRouter();

  if (inspections.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      <table className="w-full border-collapse text-sm text-ink">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-muted">
            <th scope="col" className="border-b border-line px-3 py-2.5 font-semibold">Avtalt</th>
            <th scope="col" className="border-b border-line px-3 py-2.5 font-semibold">Kunde</th>
            <th scope="col" className="border-b border-line px-3 py-2.5 font-semibold">Adresse</th>
            <th scope="col" className="border-b border-line px-3 py-2.5 font-semibold">Telefon</th>
            <th scope="col" className="border-b border-line px-3 py-2.5 font-semibold">Status</th>
            <th scope="col" className="border-b border-line px-3 py-2.5 font-semibold">Vedlegg</th>
          </tr>
        </thead>
        <tbody>
          {inspections.map((i) => {
            const overdue = isInspectionOverdue(i, today);
            const cancelled = i.status === 'avlyst';
            return (
              <tr
                key={i.id}
                onClick={() => router.push(`/befaringer/${i.id}`)}
                className="cursor-pointer hover:bg-sand"
              >
                <td className={`${td} whitespace-nowrap ${overdue ? 'font-bold text-danger' : cancelled ? 'text-muted' : ''}`}>
                  {formatInspectionWhen(i.scheduled_on, i.scheduled_time, today)}
                </td>
                <td className={`${td} font-semibold ${cancelled ? 'text-muted' : ''}`}>
                  <Link href={`/befaringer/${i.id}`} className="focus-ring" onClick={(e) => e.stopPropagation()}>
                    {i.name}
                  </Link>
                </td>
                <td className={`${td} ${cancelled ? 'text-muted' : ''}`}>{i.address || 'Mangler adresse'}</td>
                <td className={`${td} whitespace-nowrap ${cancelled ? 'text-muted' : ''}`}>{i.phone ?? '–'}</td>
                <td className={td}>
                  <InspectionStatusBadge status={i.status} />
                </td>
                <td className={`${td} tabular-nums text-muted`}>{i.file_count || '–'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
