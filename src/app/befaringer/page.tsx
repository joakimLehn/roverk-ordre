import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { listInspections } from '@/lib/db';
import { osloDate } from '@/lib/groups';
import { groupInspectionsByDate } from '@/lib/inspection-groups';
import {
  applyInspectionView,
  inspectionViewCounts,
  inspectionViewFromQuery,
  inspectionViewHref,
  searchInspections,
  type InspectionViewKey,
} from '@/lib/inspection';
import { Header } from '@/components/Header';
import { InspectionSearch } from '@/components/InspectionSearch';
import { InspectionViewTabs } from '@/components/InspectionViewTabs';
import { InspectionBottomNav } from '@/components/InspectionBottomNav';
import { InspectionCard } from '@/components/InspectionCard';
import { InspectionTable } from '@/components/InspectionTable';
import { EmptyState } from '@/components/EmptyState';

export const dynamic = 'force-dynamic';

const EMPTY_MESSAGE: Record<InspectionViewKey, string> = {
  kommende: 'Ingen kommende befaringer.',
  ferdig: 'Ingen ferdige befaringer.',
  alle: 'Ingen befaringer å vise.',
};

export default async function InspectionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { email } = await requireUser();
  const params = await searchParams;
  const view = inspectionViewFromQuery(params.vis);

  const all = await listInspections();
  const now = new Date().toISOString();
  const today = osloDate(now);

  const searched = searchInspections(all, params.q ?? '');
  const counts = inspectionViewCounts(searched);
  const visible = applyInspectionView(searched, view);
  const groups = view === 'kommende' ? groupInspectionsByDate(visible, today) : null;
  const tableRows = groups ? groups.flatMap((g) => g.inspections) : visible;

  const emptyActions = params.q
    ? [
        { label: 'Nullstill søk', href: inspectionViewHref(view, {}) },
        { label: '+ Ny befaring', href: '/befaringer/ny' },
      ]
    : view === 'alle'
      ? [{ label: '+ Ny befaring', href: '/befaringer/ny' }]
      : [
          { label: '+ Ny befaring', href: '/befaringer/ny' },
          { label: 'Se alle', href: '/befaringer?vis=alle' },
        ];

  return (
    <>
      <Header email={email} />
      <main className="mx-auto max-w-[1440px] px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+80px)] md:px-6 md:py-5 md:pb-8">
        <div className="mb-3 hidden items-center justify-between md:mb-4 md:flex">
          <h1 className="text-lg font-bold">Befaringer</h1>
          <Link
            href="/befaringer/ny"
            className="focus-ring rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white"
          >
            + Ny befaring
          </Link>
        </div>

        <InspectionViewTabs active={view} counts={counts} params={params} />
        <InspectionSearch vis={view} q={params.q} />

        {visible.length === 0 ? (
          <EmptyState message={EMPTY_MESSAGE[view]} actions={emptyActions} />
        ) : (
          <>
            <div className="md:hidden">
              {groups ? (
                groups.map((g) => (
                  <section key={g.key} className="mb-1">
                    <h2 className="flex items-center gap-2 px-0.5 pb-1.5 pt-3">
                      <span
                        className={`text-[11px] font-extrabold uppercase tracking-wider ${
                          g.key === 'forfalt' ? 'text-danger' : g.key === 'i_dag' ? 'text-brand' : 'text-muted'
                        }`}
                      >
                        {g.label}
                      </span>
                      <span className="rounded-full bg-line px-1.5 text-[11px] font-bold tabular-nums text-muted">
                        {g.inspections.length}
                      </span>
                      <span className="h-px flex-1 bg-line" />
                    </h2>
                    <div className="flex flex-col gap-2.5">
                      {g.inspections.map((i) => (
                        <InspectionCard key={i.id} inspection={i} today={today} />
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <div className="flex flex-col gap-2.5">
                  {visible.map((i) => (
                    <InspectionCard key={i.id} inspection={i} today={today} />
                  ))}
                </div>
              )}
            </div>

            <div className="hidden md:block">
              <InspectionTable inspections={tableRows} today={today} />
            </div>
          </>
        )}
      </main>

      <InspectionBottomNav active={view} counts={counts} params={params} />
    </>
  );
}
