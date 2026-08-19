import type { Order } from './types';

/**
 * «Å bygge» gruppert på planlagt byggedato.
 *
 * Lista er sortert på når ordren kom inn, som er riktig for en logg men galt
 * for spørsmålet snekkerne stiller: hva skal jeg gjøre i dag. `planned_build_date`
 * ligger allerede i basen; her brukes den til å gjøre lista om til en plan.
 *
 * Datoer sammenlignes som 'YYYY-MM-DD'-strenger. Kolonna er en `date`, og
 * strengsammenligning er både leksikografisk riktig og fri for tidssonedrift.
 */
export type BuildGroupKey = 'forfalt' | 'i_dag' | 'uka' | 'senere' | 'ingen';

export const BUILD_GROUP_ORDER: BuildGroupKey[] = ['forfalt', 'i_dag', 'uka', 'senere', 'ingen'];

export const BUILD_GROUP_LABELS: Record<BuildGroupKey, string> = {
  forfalt: 'Forfalt',
  i_dag: 'I dag',
  uka: 'Denne uka',
  senere: 'Senere',
  ingen: 'Uten byggedato',
};

const osloFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Oslo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Dagens dato i Norge som 'YYYY-MM-DD'.
 *
 * Serveren kjører i UTC. Regnet vi ut dagen derfra ville «i dag» blitt feil
 * mellom midnatt og 01/02 norsk tid – nettopp når morgenlista lastes.
 * `sv-SE` er valgt fordi det er ISO-formatet.
 */
export function osloDate(now: Date | string): string {
  return osloFormatter.format(new Date(now));
}

/** Siste dag (søndag) i den ISO-uka `today` ligger i, som 'YYYY-MM-DD'. */
function endOfWeek(today: string): string {
  const d = new Date(`${today}T12:00:00Z`);
  const weekday = d.getUTCDay() === 0 ? 7 : d.getUTCDay(); // mandag = 1, søndag = 7
  d.setUTCDate(d.getUTCDate() + (7 - weekday));
  return d.toISOString().slice(0, 10);
}

export function buildGroupOf(planned: string | null, today: string): BuildGroupKey {
  if (!planned) return 'ingen';
  if (planned < today) return 'forfalt';
  if (planned === today) return 'i_dag';
  return planned <= endOfWeek(today) ? 'uka' : 'senere';
}

export interface BuildGroup {
  key: BuildGroupKey;
  label: string;
  orders: Order[];
}

/**
 * Grupperer og sorterer. Innenfor en gruppe kommer nærmeste byggedato først,
 * og ved samme dato den eldste ordren – den som har ventet lengst.
 */
export function groupByBuildDate(orders: Order[], today: string): BuildGroup[] {
  const buckets = new Map<BuildGroupKey, Order[]>();
  for (const o of orders) {
    const key = buildGroupOf(o.planned_build_date, today);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(o);
    else buckets.set(key, [o]);
  }

  return BUILD_GROUP_ORDER.filter((key) => buckets.has(key)).map((key) => ({
    key,
    label: BUILD_GROUP_LABELS[key],
    orders: buckets.get(key)!.sort((a, b) => {
      const byDate = (a.planned_build_date ?? '').localeCompare(b.planned_build_date ?? '');
      return byDate !== 0 ? byDate : a.created_at.localeCompare(b.created_at);
    }),
  }));
}
