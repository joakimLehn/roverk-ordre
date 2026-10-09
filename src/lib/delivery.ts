// Avtalt levering: dato og klokkeslett kunden har fått beskjed om.
// Samme modell som befaringens avtale – dato og klokke i hver sin kolonne,
// lokal tid uten tidssone, klokke er valgfri men krever dato.

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** HTML time kan sende HH:MM eller HH:MM:SS. Vi lagrer HH:MM. */
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

export type DeliveryParseResult =
  | { ok: true; delivery_date: string | null; delivery_time: string | null }
  | { ok: false; error: string };

/**
 * Tom dato tømmer også klokkeslett (UI sender tom tid når dato fjernes).
 * Tid uten dato er ugyldig – vi lagrer ikke klokke alene.
 */
export function parseDelivery(date: string, time: string): DeliveryParseResult {
  const dateRaw = date.trim();
  let delivery_date: string | null = null;
  if (dateRaw) {
    if (!ISO_DATE_RE.test(dateRaw)) return { ok: false, error: 'Ugyldig dato.' };
    delivery_date = dateRaw;
  }

  const timeRaw = time.trim();
  let delivery_time: string | null = null;
  if (timeRaw) {
    if (!TIME_RE.test(timeRaw)) return { ok: false, error: 'Ugyldig klokkeslett.' };
    if (!delivery_date) return { ok: false, error: 'Klokkeslett krever leveringsdato.' };
    delivery_time = timeRaw.slice(0, 5);
  }

  return { ok: true, delivery_date, delivery_time };
}
