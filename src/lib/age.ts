import type { BuildStatus } from './types';

const DAY_MS = 86_400_000;

/**
 * Hele døgn mellom `iso` og `now`. `now` sendes inn i stedet for å leses fra
 * klokka, både fordi det gjør funksjonen testbar og fordi alderen regnes ut på
 * serveren – klientens klokke ville gitt ulik verdi ved hydrering.
 */
export function ageInDays(iso: string | null | undefined, now: string): number {
  if (!iso) return 0;
  const then = new Date(iso).getTime();
  const ref = new Date(now).getTime();
  if (Number.isNaN(then) || Number.isNaN(ref)) return 0;
  return Math.max(0, Math.floor((ref - then) / DAY_MS));
}

/**
 * Hvor lenge en ordre kan stå i en byggstatus før den er verdt å se på.
 *
 * Dette er terskler for visning, ikke forretningsregler – de gjør bare at en
 * ordre som har stått stille i tre uker ikke ser ut som en fra i går.
 * Montert har ingen terskel: der er bygget ferdig, og alder siden mottak sier
 * ikke lenger noe.
 */
export const STALE_AFTER_DAYS: Record<BuildStatus, number | null> = {
  ny: 14,
  under_bygging: 30,
  bygd: 21,
  montert: null,
};

export function isStale(status: BuildStatus, days: number): boolean {
  const threshold = STALE_AFTER_DAYS[status];
  return threshold !== null && days > threshold;
}
