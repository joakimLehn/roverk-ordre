export function formatPrice(nok: number | null | undefined): string {
  if (nok == null) return '–';
  // Intl gir smalt no-break space som tusenskille; normaliser til vanlig space
  return `${new Intl.NumberFormat('nb-NO').format(nok).replace(/[  ]/g, ' ')} kr`;
}

const SITE_LABELS: Record<string, string> = {
  skjul: 'Skjul',
  ved: 'Ved',
  orden: 'Orden',
  'orden-v2': 'Orden',
};

export function siteLabel(site: string): string {
  return SITE_LABELS[site] ?? site;
}

// Kjente config-nøkler fra nettsidens konfiguratorer + manuelle ordrer.
// Ukjente nøkler vises som de er.
const CONFIG_KEY_LABELS: Record<string, string> = {
  count: 'Antall dunker',
  serie: 'Serie',
  kledning: 'Kledning',
  montering: 'Montering',
  forankring: 'Forankring',
  navn: 'Modell',
  size: 'Størrelse',
  liter: 'Liter',
  bt: 'Kassetype',
  w: 'Bredde (kasser)',
  h: 'Høyde (kasser)',
  withWheels: 'Hjul',
  withTop: 'Topplate',
  kanal: 'Kanal',
  manuell: 'Manuell ordre',
  registrert_av: 'Registrert av',
};

const CONFIG_VALUE_LABELS: Record<string, string> = {
  royal: 'Royal',
  ubeh: 'Impregnert',
  true: 'Ja',
  false: 'Nei',
};

export function configEntries(config: Record<string, unknown>): { key: string; value: string }[] {
  return Object.entries(config)
    .filter(([, v]) => v != null && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'))
    .map(([key, v]) => ({
      key: CONFIG_KEY_LABELS[key] ?? key,
      value: CONFIG_VALUE_LABELS[String(v)] ?? String(v),
    }));
}

/** Kledning fra config -> «Royal» / «Impregnert» (null når ukjent). */
export function materialLabel(config: Record<string, unknown>): string | null {
  if (config.kledning === 'royal') return 'Royal';
  if (config.kledning === 'ubeh') return 'Impregnert';
  return null;
}

export function formatDateNo(iso: string | null | undefined): string {
  if (!iso) return '–';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '–';
  return new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(d)
    .replace(/[  ]/g, ' ');
}
