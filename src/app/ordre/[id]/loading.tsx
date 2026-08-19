import { OrderDetailSkeleton } from '@/components/Skeleton';

export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-4 md:px-6 md:py-5">
      <span className="sr-only" role="status">Henter ordren …</span>
      <OrderDetailSkeleton />
    </main>
  );
}
