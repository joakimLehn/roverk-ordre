'use client';

import { useActionState } from 'react';
import { requestCode, verifyCode, type LoginState } from './actions';

const initial: LoginState = { step: 'email' };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    async (prev: LoginState, fd: FormData) =>
      prev.step === 'email' ? requestCode(prev, fd) : verifyCode(prev, fd),
    initial,
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-sand p-6">
      <form action={formAction} className="w-[360px] rounded-xl border border-line bg-white p-8 shadow-sm">
        <h1 className="text-xl font-extrabold">
          ROVERK<span className="text-brand">.</span> Ordre
        </h1>
        <p className="mt-1 mb-5 text-sm text-muted">
          {state.step === 'email'
            ? 'Logg inn med jobb-e-posten din, så sender vi deg en engangskode.'
            : `Skriv inn koden vi sendte til ${state.email}.`}
        </p>

        {state.step === 'email' ? (
          <label className="block text-xs font-semibold text-muted">
            E-post
            <input
              name="email"
              type="email"
              required
              autoFocus
              className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-base font-normal text-ink"
            />
          </label>
        ) : (
          <>
            <input type="hidden" name="email" value={state.email} />
            <label className="block text-xs font-semibold text-muted">
              Engangskode
              <input
                name="token"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                autoFocus
                className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-center text-2xl font-bold tracking-[0.4em] text-ink"
              />
            </label>
          </>
        )}

        {state.message && <p className="mt-3 text-sm text-muted">{state.message}</p>}

        <button
          disabled={pending}
          className="mt-4 w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? 'Vent litt …' : state.step === 'email' ? 'Send meg kode' : 'Logg inn'}
        </button>
      </form>
    </main>
  );
}
