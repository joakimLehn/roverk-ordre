// Skjelettflater for loading.tsx. Samme høyder og radier som det virkelige
// innholdet, så lista ikke hopper når dataene kommer.

function Bar({ className = '' }: { className?: string }) {
  return <span className={`block animate-pulse rounded bg-line ${className}`} />;
}

export function OrderListSkeleton() {
  return (
    <div aria-hidden="true">
      {/* Mobil: kort. Skrivebord: tabellrader. */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="flex gap-3 px-3.5 pb-2.5 pt-3.5">
              <div className="flex-1 space-y-2">
                <Bar className="h-4 w-3/5" />
                <Bar className="h-3 w-2/5" />
              </div>
              <div className="space-y-2">
                <Bar className="h-4 w-20" />
                <Bar className="h-3 w-14" />
              </div>
            </div>
            <div className="flex gap-2 border-t border-line p-2.5">
              <Bar className="h-[38px] flex-[1.15] rounded-lg" />
              <Bar className="h-[38px] flex-1 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden rounded-xl border border-line bg-white md:block">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-line px-3 py-3.5 last:border-b-0">
            <Bar className="h-3.5 w-16" />
            <Bar className="h-3.5 flex-1" />
            <Bar className="h-3.5 w-32" />
            <Bar className="h-3.5 w-20" />
            <Bar className="h-5 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrderDetailSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-5">
      <div className="space-y-2">
        <Bar className="h-5 w-2/3" />
        <Bar className="h-3.5 w-1/2" />
      </div>
      <div className="flex gap-2">
        <Bar className="h-[46px] flex-1 rounded-xl" />
        <Bar className="h-[46px] flex-1 rounded-xl" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <Bar className="h-2.5 w-24" />
          <Bar className="h-[52px] w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}
