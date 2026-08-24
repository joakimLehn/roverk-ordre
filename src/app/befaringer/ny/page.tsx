import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { Header } from '@/components/Header';
import { NewInspectionForm } from './NewInspectionForm';

export const dynamic = 'force-dynamic';

export default async function NewInspectionPage() {
  const { email } = await requireUser();
  return (
    <>
      <Header email={email} />
      <main className="mx-auto max-w-3xl px-6 py-5">
        <Link href="/befaringer" className="text-[13px] text-muted">← Befaringer</Link>
        <h1 className="mt-2 mb-1 text-xl font-bold">Ny befaring</h1>
        <p className="mb-5 text-[13px] text-muted">
          For kunder som vil ha befaring på stedet. Kun navn er påkrevd, resten kan fylles inn senere.
        </p>
        <NewInspectionForm />
      </main>
    </>
  );
}
