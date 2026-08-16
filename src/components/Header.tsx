import Link from 'next/link';
import { logout } from '@/app/login/actions';

export function Header({ email }: { email: string }) {
  return (
    <header className="flex items-center gap-4 border-b border-line bg-white px-6 py-3.5">
      <Link href="/" className="text-[17px] font-extrabold">
        ROVERK<span className="text-brand">.</span> Ordre
      </Link>
      <div className="flex-1" />
      <span className="text-sm text-muted">{email}</span>
      <form action={logout}>
        <button className="cursor-pointer text-sm text-muted underline-offset-2 hover:underline">
          Logg ut
        </button>
      </form>
    </header>
  );
}
