import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getOrder, listOrderFiles } from '@/lib/db';
import { toClientOrderFileView } from '@/lib/order-file';
import { Header } from '@/components/Header';
import { OrderDetail, OrderTitle } from '@/components/OrderDetail';
import { TestFlag } from '@/components/EconomyChecks';

export const dynamic = 'force-dynamic';

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { email } = await requireUser();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const files = (await listOrderFiles(id)).map(toClientOrderFileView);

  return (
    <>
      <Header email={email} />
      <main className="mx-auto max-w-3xl px-4 py-4 md:px-6 md:py-5">
        <Link href="/" className="focus-ring flex min-h-[36px] items-center text-[13px] text-muted">
          ← Alle ordrer
        </Link>
        <div className="mt-1">
          <OrderTitle order={order} />
        </div>

        <OrderDetail order={order} files={files} />

        <div className="border-t border-dashed border-line pt-3">
          <TestFlag orderId={order.id} kunde={order.name} isTest={order.is_test} />
        </div>
      </main>
    </>
  );
}
