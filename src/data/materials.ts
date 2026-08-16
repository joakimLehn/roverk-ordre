// Statisk materialbehov per produkt (v1). Kilder: plukklister i
// «roverk as/01-Produkter/<produkt>/Kalkyler/». MÅ valideres av Joakim mot
// kalkylene før lansering. Orden har ingen plukkliste ennå -> ingen liste
// (vi viser heller ingenting enn feil liste).
export interface MaterialItem {
  navn: string;
  dimensjon: string;
  antall: string; // beholdes som tekst («2 stk», «131 lm») – kildene blander enheter
  merknad?: string;
}

export interface MaterialList {
  source: string;   // vises i UI
  perUnit: boolean; // true = tallene gjelder per enhet
  items: MaterialItem[];
}

// Plukklista gjelder 4-dunk Standard (B3100×D850×H1710). De tre synlige
// delene følger valgt kledning: Royal eller vanlig trykkimpregnert.
function skjulStandard4(kledning: 'royal' | 'ubeh'): MaterialList {
  const royal = kledning === 'royal';
  const kledningNavn = royal ? 'Royal' : 'impregnert';
  return {
    source: `Roverk Skjul – plukkliste 4-dunk Standard B3100×D850×H1710 (2026-07-21), per skur, kledning ${kledningNavn}`,
    perUnit: true,
    items: [
      { navn: 'Spilekledning', dimensjon: royal ? '28×45 Royal' : '28×45 impr. furu', antall: '131 lm', merknad: 'sider + bakvegg + frontterskel, c/c 65, inkl. ~10 % svinn' },
      { navn: 'Frontstolpe (hjørne, synlig)', dimensjon: royal ? '48×98 Royal C24 · 1466 mm' : '48×98 impr. C24 · 1466 mm', antall: '2 stk' },
      { navn: 'Frontdrager (synlig)', dimensjon: royal ? '48×148 Royal C24 · 3100 mm' : '48×148 impr. C24 · 3100 mm', antall: '1 stk', merknad: royal ? 'bekreft at 48×148 fås i Royal; ellers impreg C24 + beis' : undefined },
    { navn: 'Midtstolpe side', dimensjon: '48×48 impr. C24 · 1309 mm', antall: '2 stk' },
    { navn: 'Bakstolpe (hjørne + mellom)', dimensjon: '48×48 impr. C24 · 1301 mm', antall: '5 stk' },
    { navn: 'Sidesvill + midtrekke side', dimensjon: '48×48 impr. C24 · 850 mm', antall: '4 stk' },
    { navn: 'Midtrekke bak + bunnsvill bak', dimensjon: '48×48 impr. C24 · 3100 mm', antall: '2 stk' },
    { navn: 'Bunndrager bak + bakdrager', dimensjon: '48×98 impr. C24 · 3100 mm', antall: '2 stk' },
    { navn: 'Bunndrager side', dimensjon: '48×98 impr. C24 · 850 mm', antall: '2 stk' },
    { navn: 'Toppdrager side (skrå)', dimensjon: '48×98 impr. C24 · 877 mm', antall: '2 stk', merknad: 'kappes skrått' },
    { navn: 'Midtlekt (skjult)', dimensjon: '48×198 impr. C24 · 3100 mm', antall: '1 stk' },
    { navn: 'Takplate TP20', dimensjon: '0,5 mm stål RAL 9005 · ~3200×950 mm', antall: '1 plate', merknad: 'bestill kapp til mål' },
    { navn: 'Plateskruer TP', dimensjon: 'selvborende, sort', antall: '~30 stk' },
    { navn: 'Vinkelbeslag', dimensjon: '90°, galvanisert', antall: '~24 stk' },
    { navn: 'Konstruksjonsskrue', dimensjon: '5×90 varmforsinket', antall: '~50 stk', merknad: 'skjøter c/c ~200 mm' },
    { navn: 'Spileskruer kledning', dimensjon: '~4,5×55 rustfri A2/A4', antall: '1,5 esker', merknad: 'kledning → ramme' },
      { navn: 'Justerbar fot', dimensjon: '—', antall: '6 stk', merknad: 'oppretting ved montering' },
    ],
  };
}

const VED_MEDIUM: MaterialList = {
  source: 'Roverk Ved – plukkliste Medium 2-etasjes A-ramme Royal (2026-07-21), kappeliste per enhet',
  perUnit: true,
  items: [
    { navn: 'Sleeper – dyptgående', dimensjon: '48×98 Royal kv · 1000 mm', antall: '3 stk', merknad: 'på justerbare føtter' },
    { navn: 'Justerbar fot + helle 200×200', dimensjon: '—', antall: '6 sett', merknad: 'min 200×200 under hver fot' },
    { navn: 'Sperr (synlig)', dimensjon: '48×98 Royal kv · 2795 mm', antall: '8 stk', merknad: 'vannrett endekutt + 15 mm nibb' },
    { navn: 'Tverrbjelke / rammefot', dimensjon: '48×98 Royal kv · 2500 mm', antall: '4 stk', merknad: 'STREKKBÅND – kritisk' },
    { navn: 'Hyllebjelke', dimensjon: '48×98 Royal kv · 1202 mm', antall: '4 stk', merknad: 'bærer øvre stableetasje' },
    { navn: 'Gulvbord – dyptgående', dimensjon: '28×120 Royal terrassebord · 1000 mm', antall: '20 bord', merknad: 'nedre stableflate' },
    { navn: 'Hyllebord – dyptgående', dimensjon: '28×120 Royal terrassebord · 1000 mm', antall: '10 bord', merknad: 'øvre stableflate' },
    { navn: 'Mønebjelke (synlig)', dimensjon: '48×98 Royal kv · 1000 mm', antall: '1 stk' },
    { navn: 'Lekter kledningsfeste (skjult)', dimensjon: '36×48 impreg · 1000 mm', antall: '8 stk', merknad: 'bak skinnet' },
    { navn: 'Skinn / takkledning', dimensjon: '19×148 Royal dfals 60° · 1000 mm', antall: '42 bord', merknad: '~137 mm dekke' },
    { navn: 'Vinkelbeslag sperrfot', dimensjon: 'Simpson ABR9020', antall: '16 stk', merknad: '2 pr. sperrfot, BEGGE sider' },
    { navn: 'Vinkelbeslag hyllebjelke', dimensjon: 'Simpson ABR7015', antall: '16 stk', merknad: '2 pr. ende' },
    { navn: 'Ankernagler', dimensjon: 'CNA 4,0×40 (el. skruer CSA 5,0×40)', antall: '1 pakke', merknad: 'FULL bestykning – alle hull' },
  ],
};

const VED_STOR: MaterialList = {
  source: 'Roverk Ved – plukkliste Stor 2-etasjes A-ramme Royal (2026-07-21), kappeliste per enhet',
  perUnit: true,
  items: [
    { navn: 'Sleeper – dyptgående', dimensjon: '48×98 Royal kv · 1300 mm', antall: '4 stk', merknad: 'på justerbare føtter' },
    { navn: 'Justerbar fot + helle 200×200', dimensjon: '—', antall: '8 sett', merknad: 'min 200×200 under hver fot' },
    { navn: 'Sperr (synlig)', dimensjon: '48×98 Royal kv · 3354 mm', antall: '12 stk', merknad: 'vannrett endekutt + 15 mm nibb' },
    { navn: 'Tverrbjelke / rammefot', dimensjon: '48×98 Royal kv · 3000 mm', antall: '6 stk', merknad: 'STREKKBÅND – kritisk' },
    { navn: 'Hyllebjelke', dimensjon: '48×98 Royal kv · 1452 mm', antall: '6 stk', merknad: 'bærer øvre stableetasje' },
    { navn: 'Gulvbord – dyptgående', dimensjon: '28×120 Royal terrassebord · 1300 mm', antall: '24 bord', merknad: 'nedre stableflate' },
    { navn: 'Hyllebord – dyptgående', dimensjon: '28×120 Royal terrassebord · 1300 mm', antall: '12 bord', merknad: 'øvre stableflate' },
    { navn: 'Mønebjelke (synlig)', dimensjon: '48×98 Royal kv · 1300 mm', antall: '1 stk' },
    { navn: 'Lekter kledningsfeste (skjult)', dimensjon: '36×48 impreg · 1300 mm', antall: '10 stk', merknad: 'bak skinnet' },
    { navn: 'Skinn / takkledning', dimensjon: '19×148 Royal dfals 60° · 1300 mm', antall: '50 bord', merknad: '~137 mm dekke' },
    { navn: 'Vinkelbeslag sperrfot', dimensjon: 'Simpson ABR9020', antall: '24 stk', merknad: '2 pr. sperrfot, BEGGE sider' },
    { navn: 'Vinkelbeslag hyllebjelke', dimensjon: 'Simpson ABR7015', antall: '24 stk', merknad: '2 pr. ende' },
    { navn: 'Ankernagler', dimensjon: 'CNA 4,0×40 (el. skruer CSA 5,0×40)', antall: '1 pakke', merknad: 'FULL bestykning – alle hull' },
  ],
};

/** Leter etter et nøkkelord i alle strengverdier i config (rekursivt én level ned). */
function configContains(config: Record<string, unknown>, needle: string): boolean {
  const hay = JSON.stringify(config).toLowerCase();
  return hay.includes(needle);
}

export function materialsFor(site: string, config: Record<string, unknown>): MaterialList | null {
  const key = site === 'orden-v2' ? 'orden' : site;
  if (key === 'skjul') {
    // Plukklista gjelder 4-dunk Standard (B3100×D850×H1710). Andre antall
    // dunker/serier har andre mål -> ingen liste er bedre enn feil liste.
    const serie = String(config.serie ?? '').toLowerCase();
    const count = Number(config.count);
    if (serie !== 'standard' || count !== 4) return null;
    return skjulStandard4(config.kledning === 'royal' ? 'royal' : 'ubeh');
  }
  if (key === 'ved') {
    if (configContains(config, 'stor')) return VED_STOR;
    if (configContains(config, 'medium')) return VED_MEDIUM;
    return null; // variant ukjent -> heller ingenting enn feil liste
  }
  return null; // orden har ingen plukkliste ennå
}
