import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getInspection, listInspectionFiles } from '@/lib/db';
import { toClientFileView } from '@/lib/inspection-file';
import { formatDateNo } from '@/lib/format';
import { INSPECTION_PRODUCT_LABELS } from '@/lib/inspection';
import { Header } from '@/components/Header';
import { InspectionDetail } from '@/components/InspectionDetail';
import { InspectionDelete } from '@/components/InspectionDelete';

export const dynamic = 'force-dynamic';

export default async function InspectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { email } = await requireUser();
  const { id } = await params;
  const inspection = await getInspection(id);
  if (!inspection) notFound();

  const files = (await listInspectionFiles(id)).map(toClientFileView);

  return (
    <>
      <Header email={email} />
      <main className="mx-auto max-w-3xl px-4 py-4 md:px-6 md:py-5">
        <Link href="/befaringer" className="focus-ring flex min-h-[36px] items-center text-[13px] text-muted">
          ← Befaringer
        </Link>
        <h1 className="mt-1 text-[19px] font-extrabold leading-tight md:text-xl">{inspection.name}</h1>
        <p className="mb-4 text-[13px] text-muted">
          {[
            inspection.product ? INSPECTION_PRODUCT_LABELS[inspection.product] : null,
            inspection.channel,
            `opprettet ${formatDateNo(inspection.created_at)}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>

        <InspectionDetail inspection={inspection} files={files} />
        <InspectionDelete inspectionId={inspection.id} name={inspection.name} />
      </main>
    </>
  );
}
