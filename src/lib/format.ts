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

export function configEntries(config: Record<string, unknown>): { key: string; value: string }[] {
  return Object.entries(config)
    .filter(([, v]) => v != null && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'))
    .map(([key, v]) => ({ key, value: String(v) }));
}

export function formatDateNo(iso: string | null | undefined): string {
  if (!iso) return '–';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '–';
  return new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(d)
    .replace(/[  ]/g, ' ');
}
