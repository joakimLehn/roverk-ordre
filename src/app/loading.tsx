import { OrderListSkeleton } from '@/components/Skeleton';

// Vises mens ordrelista hentes. Uten denne står forrige side helt stille,
// og det ser ut som om trykket ikke registrerte.
export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-4 pb-24 md:px-6 md:py-5 md:pb-8">
      <span className="sr-only" role="status">Henter ordrer …</span>
      <OrderListSkeleton />
    </main>
  );
}
