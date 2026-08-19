'use client';

// Bekreftelse + angre for handlinger som skriver til databasen.
//
// Alle statusendringer er optimistiske: brikken flytter seg med én gang og
// serveren bekrefter i bakgrunnen. Da trengs to ting for at det skal være
// trygt ute i felt – at endringen bekreftes synlig, og at et feiltrykk kan
// tas tilbake uten å gå inn på ordren.

import { createContext, useCallback, useContext, useRef, useState, useTransition } from 'react';

const UNDO_MS = 5000;

interface ToastRequest {
  /** Kort setning i fortid: «Marit Kvam · fakturert». */
  message: string;
  /** Kalles hvis brukeren trykker «Angre». Utelates når det ikke er noe å angre. */
  undo?: () => void | Promise<void>;
}

interface ToastApi {
  show: (t: ToastRequest) => void;
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Ingen provider (f.eks. i en isolert test) skal ikke velte komponenten. */
const NOOP: ToastApi = { show: () => {}, showError: () => {} };

export function useToast(): ToastApi {
  return useContext(ToastContext) ?? NOOP;
}

interface Visible extends ToastRequest {
  id: number;
  kind: 'ok' | 'error';
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Visible | null>(null);
  const [undoing, startUndo] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setToast(null);
  }, []);

  const present = useCallback((t: ToastRequest, kind: 'ok' | 'error') => {
    if (timer.current) clearTimeout(timer.current);
    const id = ++nextId.current;
    setToast({ ...t, id, kind });
    timer.current = setTimeout(() => {
      // Bare skjul hvis det fortsatt er samme meldingen som står framme.
      setToast((cur) => (cur && cur.id === id ? null : cur));
    }, UNDO_MS);
  }, []);

  const show = useCallback((t: ToastRequest) => present(t, 'ok'), [present]);
  const showError = useCallback(
    (message: string) => present({ message }, 'error'),
    [present],
  );

  function onUndo() {
    const undo = toast?.undo;
    if (!undo) return;
    dismiss();
    startUndo(async () => {
      await undo();
    });
  }

  return (
    <ToastContext.Provider value={{ show, showError }}>
      {children}
      {/* Over bunnlinja på mobil, nede til venstre på skrivebord. */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+72px)] z-[60] flex justify-center md:inset-x-auto md:bottom-5 md:left-5 md:justify-start"
      >
        {toast ? (
          <div
            className={`pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl px-3.5 py-2.5 shadow-lg md:w-auto md:min-w-[280px] ${
              toast.kind === 'error' ? 'bg-danger text-white' : 'bg-ink text-white'
            }`}
          >
            <span className="flex-1 text-[13.5px] leading-snug">{toast.message}</span>
            {toast.undo ? (
              <button
                onClick={onUndo}
                disabled={undoing}
                className="min-h-[36px] cursor-pointer rounded-lg px-2 text-[13.5px] font-extrabold text-brand-light focus-ring disabled:opacity-60"
              >
                {undoing ? 'Angrer …' : 'Angre'}
              </button>
            ) : (
              <button
                onClick={dismiss}
                aria-label="Lukk"
                className="min-h-[36px] cursor-pointer rounded-lg px-2 text-[13.5px] font-bold text-white/70 focus-ring"
              >
                ✕
              </button>
            )}
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}
