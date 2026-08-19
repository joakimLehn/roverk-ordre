'use client';

import { useOptimistic, useTransition } from 'react';
import { useToast } from './Toast';

export const SAVE_ERROR = 'Kunne ikke lagre. Sjekk nettet og prøv igjen.';

interface RunOptions {
  /** Server-handlingen som faktisk skriver. */
  action: () => Promise<void>;
  /** Setningen som bekreftes i toasten, i fortid: «Marit Kvam · fakturert». */
  message: string;
  /** Server-handlingen som setter feltet tilbake. Utelates når ingenting endret seg. */
  undo?: () => Promise<void>;
}

/**
 * Ett felt på en ordre som skal svare umiddelbart på trykk.
 *
 * `value` følger serveren helt til brukeren gjør noe – da flytter den seg med
 * én gang, og serveren bekrefter i bakgrunnen. Feiler skrivingen faller
 * verdien tilbake til det serveren mener av seg selv (useOptimistic), og
 * brukeren får en feilmelding i stedet for en stille avvist endring.
 */
export function useOptimisticField<T>(serverValue: T) {
  const [value, setValue] = useOptimistic(serverValue);
  const [pending, start] = useTransition();
  const toast = useToast();

  function run(next: T, { action, message, undo }: RunOptions) {
    start(async () => {
      setValue(next);
      try {
        await action();
      } catch {
        toast.showError(SAVE_ERROR);
        return;
      }
      toast.show({ message, undo });
    });
  }

  return { value, pending, run };
}
