import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { Header } from '@/components/Header';
import { NewOrderForm } from './NewOrderForm';

export const dynamic = 'force-dynamic';

export default async function NewOrderPage() {
  const { email } = await requireUser();
  return (
    <>
      <Header email={email} />
      <main className="mx-auto max-w-3xl px-6 py-5">
        <Link href="/" className="text-[13px] text-muted">← Alle ordrer</Link>
        <h1 className="mt-2 mb-1 text-xl font-bold">Ny ordre</h1>
        <p className="mb-5 text-[13px] text-muted">
          For bestillinger som kommer utenom nettsiden – e-post, Instagram, telefon osv.
          Kun produkt og kundenavn er påkrevd, resten kan fylles inn senere.
        </p>
        <NewOrderForm />
      </main>
    </>
  );
}
