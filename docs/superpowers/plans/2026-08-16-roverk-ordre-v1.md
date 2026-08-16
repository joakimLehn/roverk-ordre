# Roverk Ordre v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Internt ordre-dashboard (ordre.roverk.no) som leser/oppdaterer nettsidens `orders`-tabell i Neon, med Supabase e-post-OTP-innlogging bak allowlist.

**Architecture:** Next.js 15 App Router på Vercel. All datatilgang server-side: Server Components leser fra Neon (`@neondatabase/serverless`), Server Actions oppdaterer. Supabase brukes kun til auth (`@supabase/ssr`, cookie-sesjon); middleware session-gater alt unntatt `/login`, og `requireUser()` re-sjekker allowlist i Neon på hver sidelast/action.

**Tech Stack:** Next.js 15 (TS, App Router, src-dir), Tailwind v4, @neondatabase/serverless, @supabase/ssr + @supabase/supabase-js, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-16-roverk-ordre-design.md`

**Miljøvariabler (kreves for kjøring, ikke for bygging/test):**
`DATABASE_URL` (samme Neon som nettsiden), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

### Task 1: Scaffold prosjektet

**Files:**
- Create: hele Next.js-skjelettet i repo-rot (create-next-app)
- Create: `vitest.config.ts`, `.env.example`
- Modify: `package.json` (scripts), `.gitignore`

- [ ] **Step 1: Scaffold Next.js i eksisterende repo**

```bash
cd /Users/joakimlehn/dev/roverk-ordre
npx --yes create-next-app@15 . --ts --tailwind --app --src-dir --eslint --import-alias "@/*" --use-npm --no-turbopack
```

Hvis create-next-app nekter pga. eksisterende filer: flytt `docs/` midlertidig ut, kjør kommandoen, flytt tilbake.

- [ ] **Step 2: Installer avhengigheter**

```bash
npm install @neondatabase/serverless @supabase/ssr @supabase/supabase-js
npm install -D vitest
```

- [ ] **Step 3: Legg til vitest-config og scripts**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: { include: ['tests/**/*.test.ts'] },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
```

I `package.json` under `scripts`, legg til:
```json
"test": "vitest run",
"db:migrate": "node scripts/migrate.mjs"
```

- [ ] **Step 4: `.env.example`**

```bash
# Samme Neon-database som roverk.no-nettsiden (orders/leads)
DATABASE_URL=postgres://...
# Supabase-prosjekt (kun Auth). Fra Supabase dashboard -> Settings -> API
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

- [ ] **Step 5: Verifiser at bygget går**

```bash
npm run build
```
Expected: bygger uten feil (standard startside).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js 15 + vitest"
```

---

### Task 2: DB-migrering (Neon)

**Files:**
- Create: `db/migrations/001-ordre-dashboard.sql`
- Create: `scripts/migrate.mjs`

- [ ] **Step 1: Skriv migreringen**

`db/migrations/001-ordre-dashboard.sql`:
```sql
-- Idempotent. Kjøres mot samme Neon-DB som nettsiden. Rører ikke nettsidens kolonner.
alter table orders add column if not exists build_status text not null default 'ny';
alter table orders add column if not exists invoiced_at timestamptz;
alter table orders add column if not exists paid_at timestamptz;
alter table orders add column if not exists is_test boolean not null default false;
alter table orders add column if not exists planned_build_date date;
alter table orders add column if not exists internal_notes text;

create table if not exists allowed_emails (
  email    text primary key,
  added_at timestamptz not null default now(),
  added_by text
);
```

- [ ] **Step 2: Skriv migrerings-script**

`scripts/migrate.mjs`:
```js
import { neon } from '@neondatabase/serverless';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL mangler. Sett den i .env.local eller miljøet.');
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);
const dir = path.join(process.cwd(), 'db', 'migrations');
for (const f of readdirSync(dir).sort()) {
  if (!f.endsWith('.sql')) continue;
  console.log('Kjører', f);
  // Neon http-driver tar én statement per kall -> splitt på ';'
  for (const stmt of readFileSync(path.join(dir, f), 'utf8').split(';')) {
    const s = stmt.trim();
    if (s) await sql.query(s);
  }
}
console.log('Ferdig.');
```

- [ ] **Step 3: Kjør hvis DATABASE_URL finnes lokalt, ellers hopp over**

```bash
[ -f .env.local ] && npm run db:migrate || echo "Ingen .env.local – kjøres ved oppsett"
```

- [ ] **Step 4: Commit**

```bash
git add db scripts && git commit -m "feat: idempotent migrering for dashboard-kolonner + allowed_emails"
```

---

### Task 3: Domenelogikk – status, KPI, formattering (TDD)

**Files:**
- Create: `src/lib/status.ts`, `src/lib/kpi.ts`, `src/lib/format.ts`, `src/lib/types.ts`, `src/lib/email.ts`
- Test: `tests/status.test.ts`, `tests/kpi.test.ts`, `tests/format.test.ts`, `tests/email.test.ts`

- [ ] **Step 1: Skriv typene**

`src/lib/types.ts`:
```ts
export type BuildStatus = 'ny' | 'under_bygging' | 'bygd' | 'montert';

export interface Order {
  id: string;
  created_at: string;            // ISO
  site: string;                  // 'skjul' | 'ved' | 'orden' | 'orden-v2'
  product: string | null;
  config: Record<string, unknown>;
  preferred_date: string | null; // ISO date
  name: string;
  phone: string;
  email: string;
  address: string | null;
  address_meta: { poststed?: string | null } & Record<string, unknown>;
  price_nok: number | null;
  build_status: BuildStatus;
  invoiced_at: string | null;
  paid_at: string | null;
  is_test: boolean;
  planned_build_date: string | null;
  internal_notes: string | null;
}
```

- [ ] **Step 2: Skriv failing tests for status**

`tests/status.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { BUILD_STATUSES, BUILD_STATUS_LABELS, isBuildStatus } from '@/lib/status';

describe('status', () => {
  it('har fire byggstatuser i riktig rekkefølge', () => {
    expect(BUILD_STATUSES).toEqual(['ny', 'under_bygging', 'bygd', 'montert']);
  });
  it('har norsk label for hver status', () => {
    expect(BUILD_STATUS_LABELS.under_bygging).toBe('Under bygging');
    for (const s of BUILD_STATUSES) expect(BUILD_STATUS_LABELS[s]).toBeTruthy();
  });
  it('godtar kun kjente statuser', () => {
    expect(isBuildStatus('montert')).toBe(true);
    expect(isBuildStatus('slettet')).toBe(false);
    expect(isBuildStatus('')).toBe(false);
  });
});
```

- [ ] **Step 3: Kjør test – skal feile**

```bash
npm test
```
Expected: FAIL (`Cannot find module '@/lib/status'`).

- [ ] **Step 4: Implementer status.ts**

`src/lib/status.ts`:
```ts
import type { BuildStatus } from './types';

export const BUILD_STATUSES: BuildStatus[] = ['ny', 'under_bygging', 'bygd', 'montert'];

export const BUILD_STATUS_LABELS: Record<BuildStatus, string> = {
  ny: 'Ny',
  under_bygging: 'Under bygging',
  bygd: 'Bygd',
  montert: 'Montert',
};

export function isBuildStatus(v: unknown): v is BuildStatus {
  return typeof v === 'string' && (BUILD_STATUSES as string[]).includes(v);
}
```

- [ ] **Step 5: Failing tests for KPI**

`tests/kpi.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { computeKpis } from '@/lib/kpi';
import type { Order } from '@/lib/types';

function o(p: Partial<Order>): Order {
  return {
    id: 'x', created_at: '2026-08-01T00:00:00Z', site: 'skjul', product: null,
    config: {}, preferred_date: null, name: 'n', phone: 'p', email: 'e',
    address: null, address_meta: {}, price_nok: null, build_status: 'ny',
    invoiced_at: null, paid_at: null, is_test: false,
    planned_build_date: null, internal_notes: null, ...p,
  };
}

describe('computeKpis', () => {
  it('teller nye, under bygging og montert-ikke-fakturert', () => {
    const k = computeKpis([
      o({ build_status: 'ny' }),
      o({ build_status: 'under_bygging' }),
      o({ build_status: 'montert' }),
      o({ build_status: 'montert', invoiced_at: '2026-08-10T00:00:00Z' }),
    ]);
    expect(k.nye).toBe(1);
    expect(k.underBygging).toBe(1);
    expect(k.montertIkkeFakturert).toBe(1);
  });
  it('utestående = fakturert men ikke betalt, summert i kr', () => {
    const k = computeKpis([
      o({ invoiced_at: '2026-08-10T00:00:00Z', price_nok: 50000 }),
      o({ invoiced_at: '2026-08-10T00:00:00Z', paid_at: '2026-08-12T00:00:00Z', price_nok: 99999 }),
      o({ invoiced_at: '2026-08-11T00:00:00Z', price_nok: 36400 }),
    ]);
    expect(k.utestaaendeNok).toBe(86400);
  });
  it('ignorerer testordrer fullstendig', () => {
    const k = computeKpis([o({ is_test: true, build_status: 'ny', invoiced_at: '2026-08-10T00:00:00Z', price_nok: 1000 })]);
    expect(k).toEqual({ nye: 0, underBygging: 0, montertIkkeFakturert: 0, utestaaendeNok: 0 });
  });
});
```

- [ ] **Step 6: Kjør test – skal feile. Implementer kpi.ts**

`src/lib/kpi.ts`:
```ts
import type { Order } from './types';

export interface Kpis {
  nye: number;
  underBygging: number;
  montertIkkeFakturert: number;
  utestaaendeNok: number;
}

export function computeKpis(orders: Order[]): Kpis {
  const reelle = orders.filter((o) => !o.is_test);
  return {
    nye: reelle.filter((o) => o.build_status === 'ny').length,
    underBygging: reelle.filter((o) => o.build_status === 'under_bygging').length,
    montertIkkeFakturert: reelle.filter((o) => o.build_status === 'montert' && !o.invoiced_at).length,
    utestaaendeNok: reelle
      .filter((o) => o.invoiced_at && !o.paid_at)
      .reduce((sum, o) => sum + (o.price_nok ?? 0), 0),
  };
}
```

- [ ] **Step 7: Failing tests for format**

`tests/format.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { formatPrice, siteLabel, configEntries, formatDateNo } from '@/lib/format';

describe('format', () => {
  it('formatterer pris med tusenskille og kr', () => {
    expect(formatPrice(64900)).toBe('64 900 kr');
    expect(formatPrice(null)).toBe('–');
  });
  it('mapper site til produktnavn', () => {
    expect(siteLabel('skjul')).toBe('Skjul');
    expect(siteLabel('ved')).toBe('Ved');
    expect(siteLabel('orden')).toBe('Orden');
    expect(siteLabel('orden-v2')).toBe('Orden');
    expect(siteLabel('ukjent')).toBe('ukjent');
  });
  it('gjør config-jsonb om til lesbare rader og hopper over tomme/objekter', () => {
    const rows = configEntries({ bredde_mm: 3100, tak: 'torvtak', nested: { a: 1 }, tom: null });
    expect(rows).toContainEqual({ key: 'bredde_mm', value: '3100' });
    expect(rows).toContainEqual({ key: 'tak', value: 'torvtak' });
    expect(rows.find((r) => r.key === 'nested')).toBeUndefined();
    expect(rows.find((r) => r.key === 'tom')).toBeUndefined();
  });
  it('formatterer ISO-dato som norsk kortdato', () => {
    expect(formatDateNo('2026-08-14')).toBe('14. aug. 2026');
    expect(formatDateNo(null)).toBe('–');
  });
});
```

- [ ] **Step 8: Kjør test – skal feile. Implementer format.ts**

`src/lib/format.ts`:
```ts
export function formatPrice(nok: number | null | undefined): string {
  if (nok == null) return '–';
  return `${new Intl.NumberFormat('nb-NO').format(nok).replace(/ /g, ' ')} kr`;
}

const SITE_LABELS: Record<string, string> = {
  skjul: 'Skjul', ved: 'Ved', orden: 'Orden', 'orden-v2': 'Orden',
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
    .format(d).replace(/ /g, ' ');
}
```

- [ ] **Step 9: Failing test for e-postnormalisering**

`tests/email.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { normalizeEmail } from '@/lib/email';

describe('normalizeEmail', () => {
  it('trimmer og lowercaser', () => {
    expect(normalizeEmail('  Ola@Snekker.NO ')).toBe('ola@snekker.no');
  });
  it('avviser ugyldig e-post', () => {
    expect(normalizeEmail('ikke-epost')).toBeNull();
    expect(normalizeEmail('')).toBeNull();
  });
});
```

- [ ] **Step 10: Implementer email.ts**

`src/lib/email.ts`:
```ts
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw: string): string | null {
  const e = raw.trim().toLowerCase();
  return EMAIL_RE.test(e) ? e : null;
}
```

- [ ] **Step 11: Kjør alle tester – grønt**

```bash
npm test
```
Expected: alle tester PASS.

- [ ] **Step 12: Commit**

```bash
git add src/lib tests && git commit -m "feat: domenelogikk for status, KPI, formattering og e-post (TDD)"
```

---

### Task 4: Materialdata (TDD + transkribering fra kalkyler)

**Files:**
- Create: `src/data/materials.ts`
- Test: `tests/materials.test.ts`

- [ ] **Step 1: Failing test**

`tests/materials.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { materialsFor } from '@/data/materials';

describe('materialsFor', () => {
  it('finner liste for skjul', () => {
    const m = materialsFor('skjul', {});
    expect(m).not.toBeNull();
    expect(m!.items.length).toBeGreaterThan(5);
    expect(m!.source).toContain('plukkliste');
  });
  it('returnerer null for ukjent site (aldri feil liste)', () => {
    expect(materialsFor('ukjent-produkt', {})).toBeNull();
  });
});
```

- [ ] **Step 2: Les kildefilene**

```bash
cat "/Users/joakimlehn/Library/CloudStorage/Dropbox/roverk as/01-Produkter/Roverk Skjul/Kalkyler/Roverk Skjul – plukkliste (4x 4-dunk Standard Royal).csv"
cat "/Users/joakimlehn/Library/CloudStorage/Dropbox/roverk as/01-Produkter/Roverk Ved/Kalkyler/Roverk Ved – plukkliste (1 Medium + 1 Stor Royal).csv"
cat "/Users/joakimlehn/Library/CloudStorage/Dropbox/roverk as/01-Produkter/Roverk Orden/Kalkyler/Roverk Orden – kalkyle.csv"
```

- [ ] **Step 3: Implementer materials.ts**

Struktur (fyll `ved`- og `orden`-listene fra CSV-ene i Step 2, per enhet — for
Ved: bruk DEL 1-radene delt på antall enheter der raden gjelder begge, ellers
kappeliste-radene per modell; for Orden: materialradene fra kalkylen):

```ts
// Statisk materialbehov per produkt (v1). Kilde: plukklister/kalkyler i
// «roverk as/01-Produkter». MÅ valideres av Joakim mot kalkylene før lansering.
export interface MaterialItem {
  navn: string;
  dimensjon: string;
  antall: string;   // beholdes som tekst («2 stk», «131 lm») – kildene blander enheter
  merknad?: string;
}
export interface MaterialList {
  source: string;   // vises i UI, f.eks. «Skjul-plukkliste 4-dunk Standard, 2026-07-21»
  perUnit: boolean; // true = tall gjelder per enhet
  items: MaterialItem[];
}

const MATERIALS: Record<string, MaterialList> = {
  skjul: {
    source: 'Roverk Skjul – plukkliste 4-dunk Standard (2026-07-21), omregnet per skur',
    perUnit: true,
    items: [
      { navn: 'Spilekledning', dimensjon: '28×45 Royal', antall: '131 lm', merknad: 'sider + bakvegg + frontterskel, c/c 65, inkl. ~10 % svinn' },
      { navn: 'Frontstolpe (hjørne, synlig)', dimensjon: '48×98 Royal C24 · 1466 mm', antall: '2 stk' },
      { navn: 'Frontdrager (synlig)', dimensjon: '48×148 Royal C24 · 3100 mm', antall: '1 stk' },
      { navn: 'Midtstolpe side', dimensjon: '48×48 impr. C24 · 1309 mm', antall: '2 stk' },
      { navn: 'Bakstolpe (hjørne + mellom)', dimensjon: '48×48 impr. C24 · 1301 mm', antall: '5 stk' },
      { navn: 'Sidesvill + midtrekke side', dimensjon: '48×48 impr. C24 · 850 mm', antall: '4 stk' },
      { navn: 'Midtrekke bak + bunnsvill bak', dimensjon: '48×48 impr. C24 · 3100 mm', antall: '2 stk' },
      { navn: 'Bunndrager bak + bakdrager', dimensjon: '48×98 impr. C24 · 3100 mm', antall: '2 stk' },
      { navn: 'Bunndrager side', dimensjon: '48×98 impr. C24 · 850 mm', antall: '2 stk' },
      { navn: 'Toppdrager side (skrå)', dimensjon: '48×98 impr. C24 · 877 mm', antall: '2 stk' },
      { navn: 'Midtlekt (skjult)', dimensjon: '48×198 impr. C24 · 3100 mm', antall: '1 stk' },
      { navn: 'Takplate TP20', dimensjon: '0,5 mm stål RAL 9005 · ~3200×950 mm', antall: '1 plate' },
      { navn: 'Plateskruer TP', dimensjon: 'selvborende, sort', antall: '~30 stk' },
      { navn: 'Vinkelbeslag', dimensjon: '90°, galvanisert', antall: '~24 stk' },
      { navn: 'Justerbar fot', dimensjon: '—', antall: '6 stk' },
    ],
  },
  ved: { /* transkriber fra Ved-plukklista i Step 2 – samme struktur */ } as MaterialList,
  orden: { /* transkriber fra Orden-kalkylen i Step 2 – samme struktur */ } as MaterialList,
};

export function materialsFor(site: string, _config: Record<string, unknown>): MaterialList | null {
  const key = site === 'orden-v2' ? 'orden' : site;
  return MATERIALS[key] ?? null;
}
```

De to `/* transkriber … */`-blokkene SKAL erstattes med faktiske rader fra
CSV-ene under implementering (dette er data-entry fra kildefilene, ikke valgfritt).

- [ ] **Step 4: Kjør tester – grønt**

```bash
npm test
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data tests/materials.test.ts && git commit -m "feat: statisk materialbehov per produkt fra plukklister"
```

---

### Task 5: DB-lag (Neon-spørringer)

**Files:**
- Create: `src/lib/db.ts`

Ingen enhetstester (rene SQL-kall, holdes trivielle – jf. spec).

- [ ] **Step 1: Implementer db.ts**

`src/lib/db.ts`:
```ts
import 'server-only';
import { neon } from '@neondatabase/serverless';
import type { BuildStatus, Order } from './types';

let _sql: ReturnType<typeof neon> | null = null;
function sql() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL!);
  return _sql;
}

const ORDER_COLS = `id, created_at, site, product, config, preferred_date, name, phone,
  email, address, address_meta, price_nok, build_status, invoiced_at, paid_at,
  is_test, planned_build_date, internal_notes`;

export async function listOrders(limit = 300): Promise<Order[]> {
  const rows = await sql().query(
    `select ${ORDER_COLS} from orders order by created_at desc limit $1`, [limit],
  );
  return rows as Order[];
}

export async function getOrder(id: string): Promise<Order | null> {
  const rows = await sql().query(`select ${ORDER_COLS} from orders where id = $1`, [id]);
  return (rows[0] as Order) ?? null;
}

export async function updateOrderFields(
  id: string,
  fields: Partial<Pick<Order,
    'build_status' | 'invoiced_at' | 'paid_at' | 'is_test' |
    'planned_build_date' | 'internal_notes' | 'name' | 'phone' | 'email' |
    'address' | 'preferred_date'>>,
): Promise<void> {
  const keys = Object.keys(fields);
  if (keys.length === 0) return;
  const sets = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  await sql().query(
    `update orders set ${sets} where id = $1`,
    [id, ...keys.map((k) => (fields as Record<string, unknown>)[k])],
  );
}

export async function isEmailAllowed(email: string): Promise<boolean> {
  const rows = await sql().query('select 1 from allowed_emails where email = $1', [email]);
  return rows.length > 0;
}
```

Merk: `updateOrderFields` interpolerer kun kolonnenavn fra vår egen typed
whitelist (nøklene i `Pick<>`), aldri brukerinput. Server actions (Task 7)
sender bare kjente nøkler.

- [ ] **Step 2: Type-sjekk**

```bash
npx tsc --noEmit
```
Expected: ingen feil.

- [ ] **Step 3: Commit**

```bash
git add src/lib/db.ts && git commit -m "feat: neon-spørringer for ordrer og allowlist"
```

---

### Task 6: Auth – Supabase OTP + allowlist + middleware

**Files:**
- Create: `src/lib/supabase.ts`, `src/lib/auth.ts`, `src/middleware.ts`
- Create: `src/app/login/page.tsx`, `src/app/login/actions.ts`

- [ ] **Step 1: Supabase server-klient**

`src/lib/supabase.ts`:
```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cs) {
          try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* kalles fra Server Component uten mutasjonslov – ok, middleware refresher */ }
        },
      },
    },
  );
}
```

- [ ] **Step 2: requireUser med allowlist-resjekk**

`src/lib/auth.ts`:
```ts
import 'server-only';
import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase';
import { isEmailAllowed } from './db';

/** Kaster brukeren til /login hvis sesjon mangler eller e-posten er fjernet fra allowlist. */
export async function requireUser(): Promise<{ email: string }> {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect('/login');
  if (!(await isEmailAllowed(user.email.toLowerCase()))) {
    await supabase.auth.signOut();
    redirect('/login');
  }
  return { email: user.email.toLowerCase() };
}
```

- [ ] **Step 3: Middleware (session-gate + refresh)**

`src/middleware.ts`:
```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cs) {
          cs.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cs.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  const isLogin = request.nextUrl.pathname.startsWith('/login');
  if (!user && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  if (user && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)'],
};
```

- [ ] **Step 4: Login-actions**

`src/app/login/actions.ts`:
```ts
'use server';

import { redirect } from 'next/navigation';
import { normalizeEmail } from '@/lib/email';
import { isEmailAllowed } from '@/lib/db';
import { supabaseServer } from '@/lib/supabase';

export interface LoginState {
  step: 'email' | 'code';
  email?: string;
  message?: string;
}

export async function requestCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = normalizeEmail(String(formData.get('email') ?? ''));
  if (!email) return { step: 'email', message: 'Skriv inn en gyldig e-postadresse.' };

  // Samme svar uansett om e-posten er på lista – lekk ikke hvem som har tilgang.
  if (await isEmailAllowed(email)) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) return { step: 'email', message: 'Kunne ikke sende kode. Prøv igjen om litt.' };
  }
  return { step: 'code', email, message: 'Hvis e-posten er registrert, har du fått en 6-sifret kode.' };
}

export async function verifyCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = normalizeEmail(String(formData.get('email') ?? ''));
  const token = String(formData.get('token') ?? '').trim();
  if (!email || !/^\d{6}$/.test(token)) {
    return { step: 'code', email: email ?? undefined, message: 'Skriv inn den 6-sifrede koden fra e-posten.' };
  }
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) return { step: 'code', email, message: 'Feil eller utløpt kode. Be om en ny.' };
  redirect('/');
}

export async function logout(): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect('/login');
}
```

- [ ] **Step 5: Login-side (to steg, samme side)**

`src/app/login/page.tsx`:
```tsx
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
    <main className="min-h-screen flex items-center justify-center bg-sand p-6">
      <form action={formAction} className="w-[360px] rounded-xl border border-line bg-white p-8 shadow-sm">
        <h1 className="text-xl font-extrabold">ROVERK<span className="text-brand">.</span> Ordre</h1>
        <p className="mt-1 mb-5 text-sm text-muted">
          {state.step === 'email'
            ? 'Logg inn med jobb-e-posten din, så sender vi deg en engangskode.'
            : `Skriv inn koden vi sendte til ${state.email}.`}
        </p>

        {state.step === 'email' ? (
          <label className="block text-xs font-semibold text-muted">
            E-post
            <input name="email" type="email" required autoFocus
              className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-base" />
          </label>
        ) : (
          <>
            <input type="hidden" name="email" value={state.email} />
            <label className="block text-xs font-semibold text-muted">
              Engangskode
              <input name="token" inputMode="numeric" pattern="\d{6}" maxLength={6} required autoFocus
                className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-center text-2xl font-bold tracking-[0.4em]" />
            </label>
          </>
        )}

        {state.message && <p className="mt-3 text-sm text-muted">{state.message}</p>}

        <button disabled={pending}
          className="mt-4 w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? 'Vent litt …' : state.step === 'email' ? 'Send meg kode' : 'Logg inn'}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 6: Bygg og type-sjekk**

```bash
npx tsc --noEmit && npm run build
```
Expected: OK. (Kjøring mot ekte Supabase/Neon verifiseres i Task 9.)

- [ ] **Step 7: Commit**

```bash
git add src/lib src/middleware.ts src/app/login && git commit -m "feat: Supabase OTP-innlogging bak allowlist + middleware"
```

---

### Task 7: Server actions for ordre-oppdateringer

**Files:**
- Create: `src/app/ordre/[id]/actions.ts`

- [ ] **Step 1: Implementer actions**

`src/app/ordre/[id]/actions.ts`:
```ts
'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { updateOrderFields } from '@/lib/db';
import { isBuildStatus } from '@/lib/status';
import { normalizeEmail } from '@/lib/email';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function done(id: string) {
  revalidatePath('/');
  revalidatePath(`/ordre/${id}`);
}

export async function setBuildStatus(id: string, status: string): Promise<void> {
  await requireUser();
  if (!isBuildStatus(status)) throw new Error('Ukjent byggstatus');
  await updateOrderFields(id, { build_status: status });
  done(id);
}

export async function setInvoiced(id: string, invoiced: boolean): Promise<void> {
  await requireUser();
  await updateOrderFields(id, { invoiced_at: invoiced ? new Date().toISOString() : null });
  done(id);
}

export async function setPaid(id: string, paid: boolean): Promise<void> {
  await requireUser();
  await updateOrderFields(id, { paid_at: paid ? new Date().toISOString() : null });
  done(id);
}

export async function setTestFlag(id: string, isTest: boolean): Promise<void> {
  await requireUser();
  await updateOrderFields(id, { is_test: isTest });
  done(id);
}

export async function setPlannedDate(id: string, date: string): Promise<void> {
  await requireUser();
  await updateOrderFields(id, { planned_build_date: ISO_DATE_RE.test(date) ? date : null });
  done(id);
}

export async function saveNotes(id: string, notes: string): Promise<void> {
  await requireUser();
  await updateOrderFields(id, { internal_notes: notes.slice(0, 10_000) });
  done(id);
}

export async function saveCustomer(id: string, formData: FormData): Promise<void> {
  await requireUser();
  const name = String(formData.get('name') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const email = normalizeEmail(String(formData.get('email') ?? ''));
  const address = String(formData.get('address') ?? '').trim();
  const pd = String(formData.get('preferred_date') ?? '').trim();
  if (!name || !phone || !email) throw new Error('Navn, telefon og gyldig e-post er påkrevd');
  await updateOrderFields(id, {
    name, phone, email,
    address: address || null,
    preferred_date: ISO_DATE_RE.test(pd) ? pd : null,
  });
  done(id);
}
```

- [ ] **Step 2: Type-sjekk + commit**

```bash
npx tsc --noEmit
git add src/app/ordre && git commit -m "feat: server actions for statusflyt, økonomi, notater og kundeinfo"
```

---

### Task 8: UI – design-tokens, ordreliste og ordredetaljer

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `src/components/Badge.tsx`, `src/components/Kpis.tsx`, `src/components/Filters.tsx`,
  `src/components/OrderTable.tsx`, `src/components/StatusButtons.tsx`,
  `src/components/EconomyChecks.tsx`, `src/components/NotesForm.tsx`,
  `src/components/CustomerForm.tsx`, `src/components/Header.tsx`
- Create: `src/app/ordre/[id]/page.tsx`

Design: følg mockupen (godkjent). Farger som Tailwind-tokens i `globals.css`:

- [ ] **Step 1: Tokens i globals.css (Tailwind v4 `@theme`)**

Legg til i `src/app/globals.css` etter `@import "tailwindcss";`:
```css
@theme {
  --color-brand: #DE7214;
  --color-brand-dark: #B85C0E;
  --color-sand: #F6F4F1;
  --color-ink: #26221E;
  --color-muted: #7A736B;
  --color-line: #E7E2DB;
  --color-ok: #2E7D46;
  --color-ok-bg: #E3F2E8;
  --color-info: #2A5FA8;
  --color-info-bg: #E5EEFA;
  --color-warn: #9A6A12;
  --color-warn-bg: #FBF0DC;
  --color-danger: #B3402E;
  --color-danger-bg: #F7E7E3;
}
body { background: var(--color-sand); color: var(--color-ink); }
```

- [ ] **Step 2: Layout + Header**

`src/app/layout.tsx` – sett `lang="no"`, tittel «Roverk Ordre», behold font-oppsettet fra scaffold.

`src/components/Header.tsx`:
```tsx
import { logout } from '@/app/login/actions';

export function Header({ email }: { email: string }) {
  return (
    <header className="flex items-center gap-4 border-b border-line bg-white px-6 py-3.5">
      <a href="/" className="text-[17px] font-extrabold">ROVERK<span className="text-brand">.</span> Ordre</a>
      <div className="flex-1" />
      <span className="text-sm text-muted">{email}</span>
      <form action={logout}>
        <button className="text-sm text-muted underline-offset-2 hover:underline">Logg ut</button>
      </form>
    </header>
  );
}
```

- [ ] **Step 3: Badge, Kpis, Filters, OrderTable**

`src/components/Badge.tsx`:
```tsx
import type { BuildStatus } from '@/lib/types';
import { BUILD_STATUS_LABELS } from '@/lib/status';

const STYLES: Record<BuildStatus, string> = {
  ny: 'bg-warn-bg text-warn',
  under_bygging: 'bg-info-bg text-info',
  bygd: 'bg-line text-ink',
  montert: 'bg-ok-bg text-ok',
};

export function StatusBadge({ status }: { status: BuildStatus }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${STYLES[status]}`}>
      {BUILD_STATUS_LABELS[status]}
    </span>
  );
}

export function TestBadge() {
  return <span className="inline-block rounded-full bg-danger-bg px-2.5 py-0.5 text-[11.5px] font-bold text-danger">TEST</span>;
}
```

`src/components/Kpis.tsx`:
```tsx
import type { Kpis } from '@/lib/kpi';
import { formatPrice } from '@/lib/format';

export function KpiRow({ kpis }: { kpis: Kpis }) {
  const cards = [
    { n: String(kpis.nye), t: 'Nye ordrer', hot: true },
    { n: String(kpis.underBygging), t: 'Under bygging' },
    { n: String(kpis.montertIkkeFakturert), t: 'Montert, ikke fakturert' },
    { n: formatPrice(kpis.utestaaendeNok), t: 'Utestående (fakturert, ikke betalt)' },
  ];
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.t} className="rounded-xl border border-line bg-white px-3.5 py-3">
          <div className={`text-2xl font-extrabold ${c.hot ? 'text-brand' : ''}`}>{c.n}</div>
          <div className="text-xs text-muted">{c.t}</div>
        </div>
      ))}
    </div>
  );
}
```

`src/components/Filters.tsx` (GET-form → searchParams, ingen client-JS nødvendig):
```tsx
import { BUILD_STATUSES, BUILD_STATUS_LABELS } from '@/lib/status';

export function Filters({ params }: { params: { q?: string; produkt?: string; status?: string; faktura?: string; vis_test?: string } }) {
  const sel = 'rounded-lg border border-line bg-white px-2.5 py-2 text-[13px]';
  return (
    <form method="get" className="mb-3.5 flex flex-wrap items-center gap-2.5">
      <input type="search" name="q" defaultValue={params.q ?? ''} placeholder="Søk på navn, e-post, telefon …"
        className="min-w-[180px] flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm" />
      <select name="produkt" defaultValue={params.produkt ?? ''} className={sel}>
        <option value="">Alle produkter</option>
        <option value="skjul">Skjul</option>
        <option value="ved">Ved</option>
        <option value="orden">Orden</option>
      </select>
      <select name="status" defaultValue={params.status ?? ''} className={sel}>
        <option value="">Alle statuser</option>
        {BUILD_STATUSES.map((s) => <option key={s} value={s}>{BUILD_STATUS_LABELS[s]}</option>)}
      </select>
      <select name="faktura" defaultValue={params.faktura ?? ''} className={sel}>
        <option value="">Faktura: alle</option>
        <option value="ikke_fakturert">Ikke fakturert</option>
        <option value="fakturert">Fakturert, ikke betalt</option>
        <option value="betalt">Betalt</option>
      </select>
      <label className="flex items-center gap-1.5 text-[13px] text-muted">
        <input type="checkbox" name="vis_test" value="1" defaultChecked={params.vis_test === '1'} />
        Vis testordrer
      </label>
      <button className="rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-semibold">Filtrer</button>
    </form>
  );
}
```

`src/components/OrderTable.tsx`:
```tsx
import Link from 'next/link';
import type { Order } from '@/lib/types';
import { StatusBadge, TestBadge } from './Badge';
import { formatDateNo, formatPrice, siteLabel } from '@/lib/format';

export function OrderTable({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <p className="rounded-xl border border-line bg-white p-8 text-center text-sm text-muted">Ingen ordrer matcher filteret.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wider text-muted">
            {['Mottatt', 'Produkt', 'Kunde', 'Pris', 'Byggstatus', 'Faktura', 'Byggedato'].map((h) => (
              <th key={h} className="border-b border-line px-3 py-2.5 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className={`hover:bg-sand ${o.is_test ? 'opacity-45' : ''}`}>
              <td className="border-b border-line px-3 py-2.5 whitespace-nowrap">
                <Link href={`/ordre/${o.id}`} className="block">{formatDateNo(o.created_at)}</Link>
              </td>
              <td className="border-b border-line px-3 py-2.5 font-semibold">
                <Link href={`/ordre/${o.id}`} className="block">
                  {siteLabel(o.site)}{o.product ? ` – ${o.product}` : ''}
                </Link>
              </td>
              <td className="border-b border-line px-3 py-2.5">
                <Link href={`/ordre/${o.id}`} className="block">
                  {o.name}
                  {o.address_meta?.poststed ? <span className="block text-xs text-muted">{String(o.address_meta.poststed)}</span> : null}
                </Link>
              </td>
              <td className="border-b border-line px-3 py-2.5 whitespace-nowrap">{formatPrice(o.price_nok)}</td>
              <td className="border-b border-line px-3 py-2.5">
                {o.is_test ? <TestBadge /> : <StatusBadge status={o.build_status} />}
              </td>
              <td className="border-b border-line px-3 py-2.5 text-xs whitespace-nowrap">
                {o.paid_at ? <span className="font-bold text-ok">✓ Betalt</span>
                  : o.invoiced_at ? <span><span className="font-bold text-ok">✓ Fakturert</span> · ikke betalt</span>
                  : <span className="text-muted">–</span>}
              </td>
              <td className="border-b border-line px-3 py-2.5 text-xs whitespace-nowrap">{formatDateNo(o.planned_build_date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: Ordreliste-siden**

`src/app/page.tsx`:
```tsx
import { requireUser } from '@/lib/auth';
import { listOrders } from '@/lib/db';
import { computeKpis } from '@/lib/kpi';
import { Header } from '@/components/Header';
import { KpiRow } from '@/components/Kpis';
import { Filters } from '@/components/Filters';
import { OrderTable } from '@/components/OrderTable';
import type { Order } from '@/lib/types';

export const dynamic = 'force-dynamic';

function applyFilters(orders: Order[], p: Record<string, string | undefined>): Order[] {
  let r = orders;
  if (p.vis_test !== '1') r = r.filter((o) => !o.is_test);
  if (p.produkt) r = r.filter((o) => (o.site === 'orden-v2' ? 'orden' : o.site) === p.produkt);
  if (p.status) r = r.filter((o) => o.build_status === p.status);
  if (p.faktura === 'ikke_fakturert') r = r.filter((o) => !o.invoiced_at);
  if (p.faktura === 'fakturert') r = r.filter((o) => o.invoiced_at && !o.paid_at);
  if (p.faktura === 'betalt') r = r.filter((o) => !!o.paid_at);
  if (p.q) {
    const q = p.q.toLowerCase();
    r = r.filter((o) =>
      o.name.toLowerCase().includes(q) || o.email.toLowerCase().includes(q) || o.phone.includes(q));
  }
  return r;
}

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { email } = await requireUser();
  const params = await searchParams;
  const all = await listOrders();
  const filtered = applyFilters(all, params);
  const kpis = computeKpis(all);

  return (
    <>
      <Header email={email} />
      <main className="mx-auto max-w-6xl px-6 py-5">
        <KpiRow kpis={kpis} />
        <Filters params={params} />
        <OrderTable orders={filtered} />
      </main>
    </>
  );
}
```

- [ ] **Step 5: Klientkomponenter for detaljsiden**

`src/components/StatusButtons.tsx`:
```tsx
'use client';

import { useTransition } from 'react';
import { BUILD_STATUSES, BUILD_STATUS_LABELS } from '@/lib/status';
import type { BuildStatus } from '@/lib/types';
import { setBuildStatus } from '@/app/ordre/[id]/actions';

export function StatusButtons({ orderId, current }: { orderId: string; current: BuildStatus }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-1.5">
      {BUILD_STATUSES.map((s) => (
        <button key={s} disabled={pending}
          onClick={() => start(() => setBuildStatus(orderId, s))}
          className={`rounded-lg border px-3 py-1.5 text-[13px] font-semibold disabled:opacity-60 ${
            s === current ? 'border-info bg-info-bg text-info' : 'border-line bg-white text-muted'}`}>
          {BUILD_STATUS_LABELS[s]}
        </button>
      ))}
    </div>
  );
}
```

`src/components/EconomyChecks.tsx`:
```tsx
'use client';

import { useTransition } from 'react';
import { setInvoiced, setPaid, setTestFlag } from '@/app/ordre/[id]/actions';

export function EconomyChecks({ orderId, invoiced, paid }: { orderId: string; invoiced: boolean; paid: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-5 text-sm">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={invoiced} disabled={pending}
          onChange={(e) => start(() => setInvoiced(orderId, e.target.checked))} />
        Fakturert
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={paid} disabled={pending}
          onChange={(e) => start(() => setPaid(orderId, e.target.checked))} />
        Betalt
      </label>
    </div>
  );
}

export function TestFlag({ orderId, isTest }: { orderId: string; isTest: boolean }) {
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center gap-2 text-[13px] text-muted">
      <input type="checkbox" checked={isTest} disabled={pending}
        onChange={(e) => start(() => setTestFlag(orderId, e.target.checked))} />
      Marker som testordre <span className="ml-auto text-xs">Skjules fra tall og lister</span>
    </label>
  );
}
```

`src/components/NotesForm.tsx`:
```tsx
'use client';

import { useState, useTransition } from 'react';
import { saveNotes, setPlannedDate } from '@/app/ordre/[id]/actions';

export function NotesForm({ orderId, notes }: { orderId: string; notes: string }) {
  const [value, setValue] = useState(notes);
  const [pending, start] = useTransition();
  return (
    <div>
      <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={4}
        className="w-full rounded-lg border border-line bg-white p-2.5 text-[13.5px]" />
      <button disabled={pending} onClick={() => start(() => saveNotes(orderId, value))}
        className="mt-1.5 rounded-lg border border-line bg-white px-3.5 py-2 text-[13px] font-semibold disabled:opacity-60">
        {pending ? 'Lagrer …' : 'Lagre notat'}
      </button>
    </div>
  );
}

export function PlannedDate({ orderId, date }: { orderId: string; date: string }) {
  const [pending, start] = useTransition();
  return (
    <input type="date" defaultValue={date} disabled={pending}
      onChange={(e) => start(() => setPlannedDate(orderId, e.target.value))}
      className="rounded-lg border border-line bg-white px-2.5 py-2 text-sm" />
  );
}
```

`src/components/CustomerForm.tsx`:
```tsx
'use client';

import { useState, useTransition } from 'react';
import type { Order } from '@/lib/types';
import { saveCustomer } from '@/app/ordre/[id]/actions';

export function CustomerForm({ order }: { order: Order }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  if (!editing) {
    return (
      <div className="grid grid-cols-[110px_1fr] gap-y-1 text-[13.5px]">
        <span className="text-muted">Navn</span><span>{order.name}</span>
        <span className="text-muted">Telefon</span><a href={`tel:${order.phone}`}>{order.phone}</a>
        <span className="text-muted">E-post</span><a href={`mailto:${order.email}`}>{order.email}</a>
        <span className="text-muted">Adresse</span><span>{order.address ?? '–'}</span>
        <span className="text-muted">Ønsket dato</span><span>{order.preferred_date ?? '–'}</span>
        <button onClick={() => setEditing(true)} className="col-span-2 mt-1 w-fit text-[13px] font-semibold text-brand">
          Rediger kundeinfo
        </button>
      </div>
    );
  }

  const input = 'w-full rounded-lg border border-line bg-white px-2.5 py-2 text-sm';
  return (
    <form action={(fd) => start(async () => { await saveCustomer(order.id, fd); setEditing(false); })}
      className="grid gap-2 text-sm">
      <input name="name" defaultValue={order.name} placeholder="Navn" required className={input} />
      <input name="phone" defaultValue={order.phone} placeholder="Telefon" required className={input} />
      <input name="email" type="email" defaultValue={order.email} placeholder="E-post" required className={input} />
      <input name="address" defaultValue={order.address ?? ''} placeholder="Adresse" className={input} />
      <label className="text-xs text-muted">Ønsket dato
        <input name="preferred_date" type="date" defaultValue={order.preferred_date ?? ''} className={`${input} mt-1`} />
      </label>
      <div className="flex gap-2">
        <button disabled={pending} className="rounded-lg bg-brand px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-60">
          {pending ? 'Lagrer …' : 'Lagre'}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="rounded-lg border border-line px-3.5 py-2 text-[13px]">
          Avbryt
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 6: Detaljsiden**

`src/app/ordre/[id]/page.tsx`:
```tsx
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getOrder } from '@/lib/db';
import { materialsFor } from '@/data/materials';
import { configEntries, formatDateNo, formatPrice, siteLabel } from '@/lib/format';
import { Header } from '@/components/Header';
import { StatusButtons } from '@/components/StatusButtons';
import { EconomyChecks, TestFlag } from '@/components/EconomyChecks';
import { NotesForm, PlannedDate } from '@/components/NotesForm';
import { CustomerForm } from '@/components/CustomerForm';

export const dynamic = 'force-dynamic';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{title}</h3>
      {children}
    </section>
  );
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { email } = await requireUser();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const materials = materialsFor(order.site, order.config);
  const cfg = configEntries(order.config);

  return (
    <>
      <Header email={email} />
      <main className="mx-auto max-w-3xl px-6 py-5">
        <a href="/" className="text-[13px] text-muted">← Alle ordrer</a>
        <h1 className="mt-2 text-xl font-bold">
          {siteLabel(order.site)}{order.product ? ` – ${order.product}` : ''} · {order.name}
        </h1>
        <p className="mb-5 text-[13px] text-muted">
          Mottatt {formatDateNo(order.created_at)} · {formatPrice(order.price_nok)} · #{order.id.slice(0, 8)}
        </p>

        <Section title="Byggstatus"><StatusButtons orderId={order.id} current={order.build_status} /></Section>
        <Section title="Økonomi">
          <EconomyChecks orderId={order.id} invoiced={!!order.invoiced_at} paid={!!order.paid_at} />
        </Section>
        <Section title="Planlagt byggedato">
          <PlannedDate orderId={order.id} date={order.planned_build_date ?? ''} />
        </Section>
        <Section title="Kunde"><CustomerForm order={order} /></Section>

        {cfg.length > 0 && (
          <Section title="Bestilling">
            <div className="grid grid-cols-[160px_1fr] gap-y-1 text-[13.5px]">
              {cfg.map((r) => (<span key={r.key} className="contents">
                <span className="text-muted">{r.key}</span><span>{r.value}</span>
              </span>))}
            </div>
          </Section>
        )}

        <Section title="Materialbehov">
          {materials ? (
            <div className="overflow-x-auto rounded-xl border border-line bg-white">
              <table className="w-full text-[13px]">
                <thead><tr className="text-left text-muted">
                  <th className="border-b border-line px-2.5 py-1.5 font-semibold">Materiale</th>
                  <th className="border-b border-line px-2.5 py-1.5 font-semibold">Dimensjon</th>
                  <th className="border-b border-line px-2.5 py-1.5 font-semibold">Antall</th>
                </tr></thead>
                <tbody>
                  {materials.items.map((m) => (
                    <tr key={m.navn}>
                      <td className="border-b border-line px-2.5 py-1.5">{m.navn}{m.merknad ? <span className="block text-xs text-muted">{m.merknad}</span> : null}</td>
                      <td className="border-b border-line px-2.5 py-1.5">{m.dimensjon}</td>
                      <td className="border-b border-line px-2.5 py-1.5 whitespace-nowrap">{m.antall}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-2.5 py-1.5 text-xs text-muted">
                {materials.perUnit ? 'Per enhet · ' : ''}Kilde: {materials.source}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted">Materialliste mangler for denne varianten.</p>
          )}
        </Section>

        <Section title="Interne notater">
          <NotesForm orderId={order.id} notes={order.internal_notes ?? ''} />
        </Section>

        <div className="border-t border-dashed border-line pt-4">
          <TestFlag orderId={order.id} isTest={order.is_test} />
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 7: Bygg + tester**

```bash
npx tsc --noEmit && npm test && npm run build
```
Expected: alt grønt.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: ordreliste med KPI/filtre og ordredetaljer med materialbehov"
```

---

### Task 9: README, allowlist-hjelper og lokal verifisering

**Files:**
- Create: `README.md`, `scripts/add-email.mjs`

- [ ] **Step 1: Allowlist-hjelper**

`scripts/add-email.mjs`:
```js
import { neon } from '@neondatabase/serverless';

const email = (process.argv[2] ?? '').trim().toLowerCase();
if (!email || !email.includes('@')) {
  console.error('Bruk: node scripts/add-email.mjs ola@snekker.no');
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);
await sql.query(
  'insert into allowed_emails (email, added_by) values ($1, $2) on conflict (email) do nothing',
  [email, 'script'],
);
console.log('La til', email);
```

- [ ] **Step 2: README med oppsett-steg**

`README.md` skal dekke: hva appen er, env-variabler (fra `.env.example`),
Supabase-oppsett (nytt prosjekt → Auth → Email OTP, norsk e-postmal, kopiér
URL/anon key), `npm run db:migrate`, `node --env-file=.env.local scripts/add-email.mjs <epost>`,
`npm run dev`, deploy til Vercel med domene `ordre.roverk.no`. Skriv den ut i sin helhet.

- [ ] **Step 3: Kjør appen lokalt hvis env finnes**

Med `.env.local` på plass: start dev-server via preview-verktøyet, logg inn med
en allowlist-e-post, sjekk liste + detalj + statusendring. Uten env: noter i
README at dette gjenstår, og verifiser kun `npm run build`.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "docs: README med oppsett + allowlist-script"
```

---

### Task 10: Ferdigstilling

- [ ] **Step 1: Kjør full verifisering**

```bash
npx tsc --noEmit && npm test && npm run build
```
Expected: grønt.

- [ ] **Step 2: Selvreview mot spec** – gå gjennom spec-fila punkt for punkt og
  bekreft at hver v1-funksjon finnes. Avvik fikses før ferdigmelding.

- [ ] **Step 3: Rapportér til Joakim** hva som gjenstår manuelt:
  Supabase-prosjekt + env-verdier, `db:migrate` mot prod-Neon, allowlist-e-poster,
  Vercel-prosjekt + `ordre.roverk.no`, validering av materiallister mot kalkylene.
