'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { logout } from '@/app/login/actions';

function initials(email: string): string {
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : local.slice(0, 2);
  return letters.toUpperCase() || '?';
}

/**
 * Toppraden.
 *
 * På mobil er den øverste raden den knappeste plassen på skjermen, og e-post +
 * «Logg ut» er ingen av tingene som trengs ute i felt. Begge ligger nå bak en
 * initialbrikke; på skrivebord er det plass til å vise e-posten direkte.
 */
export function Header({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <header className="flex items-center gap-3 border-b border-line bg-white px-4 py-2.5 md:px-6 md:py-3.5">
      <Link href="/" className="focus-ring text-[16px] font-extrabold md:text-[17px]">
        ROVERK<span className="text-brand">.</span> Ordre
      </Link>
      <div className="flex-1" />
      <span className="hidden text-sm text-muted md:inline">{email}</span>
      <div ref={wrap} className="relative md:hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={`Konto: ${email}`}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full bg-brand text-[11.5px] font-bold text-white"
        >
          {initials(email)}
        </button>
        {open ? (
          <div
            role="menu"
            className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-line bg-white shadow-lg"
          >
            <p className="truncate border-b border-line px-3.5 py-2.5 text-xs text-muted">{email}</p>
            <form action={logout}>
              <button
                role="menuitem"
                className="focus-ring min-h-[46px] w-full cursor-pointer px-3.5 text-left text-[14px] font-semibold"
              >
                Logg ut
              </button>
            </form>
          </div>
        ) : null}
      </div>
      <form action={logout} className="hidden md:block">
        <button className="focus-ring cursor-pointer rounded text-sm text-muted underline-offset-2 hover:underline">
          Logg ut
        </button>
      </form>
    </header>
  );
}
