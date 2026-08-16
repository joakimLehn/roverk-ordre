# Roverk Ordre – design (v1)

Dato: 2026-08-16 · Status: godkjent av Joakim (mockup + design godkjent i samtale)

## Formål

Internt admin-dashboard for alle innkommende ordrer fra roverk.no. Alle ansatte
(snekkere inkludert) skal kunne se ordrer, status (bygd/ikke bygd, fakturert/
betalt), kundeinfo og materialbehov – og oppdatere status underveis.

Mockup (godkjent): https://claude.ai/code/artifact/f0ece3a2-cd1a-4b44-93d1-79d7f1a30e4b

## Rammer og avklarte valg

- **Data bor i Neon** – samme Postgres-database som nettsiden
  (`03-Nettsider/api/_lib/db.js`) skriver `orders`/`leads` til. Dashboardet
  leser/oppdaterer direkte der. Ingen migrering av data.
- **Supabase brukes kun til auth** – e-post + 6-sifret engangskode (OTP).
  Passordløst, ingen 2FA i v1 (kan utvides senere).
- **Tilgang: e-post-allowlist.** Kun forhåndsgodkjente e-poster får tilsendt
  kode. Allowlist ligger i Neon (`allowed_emails`). Admin-UI for lista er
  utenfor v1 – e-poster legges til med et lite script/SQL.
- **Status modelleres som to dimensjoner + flagg:**
  - Byggstatus: `ny → under_bygging → bygd → montert` (fri navigasjon, ikke låst rekkefølge)
  - Økonomi: `invoiced_at` (fakturert) og `paid_at` (betalt) – uavhengige avhukinger
  - `is_test`: markerer testordrer; skjules som standard fra lister og KPI-tall
- **Materialbehov v1: statiske lister** per produkt/størrelse, seedet fra
  plukklistene/kalkylene i `01-Produkter/*/Kalkyler/` (plukkliste-CSV-ene er
  primærkilde). Vises på ordredetaljene. Dynamisk beregning fra config er v2.
- **Kun ordrer i v1.** Leads-fane kan komme senere (samme DB, lett å legge til).
- **Domene:** `ordre.roverk.no` på Vercel.

## Arkitektur

Next.js (App Router, TypeScript) på Vercel. Alt datatilgang skjer server-side.

```
Nettleser ──> Next.js (ordre.roverk.no)
               ├── Middleware: krever gyldig Supabase-sesjon på alt unntatt /login
               ├── Server Components: leser ordrer fra Neon
               ├── Server Actions: oppdaterer status/notater/kundeinfo i Neon
               └── /login: allowlist-sjekk (Neon) → Supabase OTP → sesjon (cookies)
Neon Postgres (delt med nettsiden): orders, leads, allowed_emails
Supabase: kun Auth (OTP-e-post, sesjoner)
```

- DB-klient: `@neondatabase/serverless` (samme som nettsiden). Ikke ORM –
  parameteriserte spørringer i et lite `src/lib/db.ts`.
- Auth-klient: `@supabase/ssr` med cookie-basert sesjon.
- UI: Tailwind + shadcn/ui, norsk språk, Roverk-oransje `#DE7214`.

### Innloggingsflyt

1. Bruker skriver e-post på `/login`.
2. Server action sjekker `allowed_emails` i Neon. Ikke på lista → generisk
   melding («Hvis e-posten er registrert, får du en kode») – ingen kode sendes,
   og vi lekker ikke hvem som har tilgang.
3. På lista → `supabase.auth.signInWithOtp({ email, shouldCreateUser: true })`.
   Supabase sender 6-sifret kode.
4. Bruker taster koden → `verifyOtp` → sesjon settes i cookies.
5. Middleware verifiserer sesjon på alle øvrige ruter og sjekker at
   sesjons-e-posten fortsatt står i allowlist (fjernet ansatt = umiddelbart ute).

### Databaseendringer (idempotent, kjøres mot Neon)

Nettsidens kolonner røres ikke; `status`-feltet nettsiden setter (`new`)
beholdes urørt. Nye kolonner:

```sql
alter table orders add column if not exists build_status text not null default 'ny';
alter table orders add column if not exists invoiced_at timestamptz;
alter table orders add column if not exists paid_at timestamptz;
alter table orders add column if not exists is_test boolean not null default false;
alter table orders add column if not exists planned_build_date date;
alter table orders add column if not exists internal_notes text;

create table if not exists allowed_emails (
  email      text primary key,
  added_at   timestamptz not null default now(),
  added_by   text
);
```

`build_status`-verdier: `ny`, `under_bygging`, `bygd`, `montert`.
Migreringen ligger i `db/migrations/001-ordre-dashboard.sql` og kjøres med
`npm run db:migrate` (leser `DATABASE_URL`).

## Funksjoner i v1

1. **Ordreliste** (`/`): tabell sortert nyest først. Kolonner: mottatt, produkt
   (+ viktigste config-detaljer), kunde (navn + sted), pris, byggstatus-badge,
   faktura/betalt, planlagt byggedato. Søk (navn/e-post/telefon), filter på
   produkt, byggstatus og fakturastatus. «Skjul testordrer» på som standard.
2. **KPI-rad**: nye ordrer, under bygging, montert-ikke-fakturert, utestående
   beløp (fakturert men ikke betalt). Testordrer telles aldri med.
3. **Ordredetaljer** (panel/rute per ordre):
   - Byggstatus-knapper (fri veksling mellom de fire)
   - Avhuking fakturert / betalt (lagrer tidsstempel)
   - Planlagt byggedato (datofelt)
   - Kundeinfo med redigering (navn, telefon, e-post, adresse, ønsket dato)
   - Bestillingsdetaljer fra `config` (lesbar visning av jsonb)
   - Materialbehov: statisk liste slått opp på produkt + størrelse fra config
   - Interne notater (fritekst, lagre-knapp)
   - «Marker som testordre»
4. **Innlogging** som beskrevet over.

## Materialdata

`src/data/materials.ts`: oppslagstabell `produkt + variant → liste av
{ navn, dimensjon, antall, enhet }`. Seedes fra plukkliste-CSV-ene i
`01-Produkter`. Der config-varianten ikke finnes i tabellen vises «Materialliste
mangler for denne varianten» – aldri feil liste. Kilde og revisjon oppgis i
UI-et (f.eks. «fra kalkyle Rev C»). **Innholdet må valideres av Joakim mot
kalkylene før lansering** (jf. tidligere feil med enhetspriser).

## Feilhåndtering

- DB nede → feilside med «prøv igjen», ingen halvlagrede oppdateringer
  (én UPDATE per handling).
- Samtidige redigeringer: siste skriving vinner (akseptabelt i v1, lite team).
- OTP-feil/utløpt kode → tydelig melding, mulighet for ny kode.
- Alle server actions validerer at sesjonen finnes og at e-post er i allowlist.

## Testing

- Vitest for ren logikk: allowlist-sjekk, KPI-beregninger, materialoppslag,
  config-formattering, statusoverganger.
- Én integrasjonstest av SQL-spørringene mot en lokal Postgres er *ikke* med i
  v1 (krever infra); spørringer holdes trivielle og gjennomgås manuelt.
- Manuell verifisering i preview før prod-deploy.

## Deploy og drift

- Eget Vercel-prosjekt `roverk-ordre`, domene `ordre.roverk.no`.
- Env: `DATABASE_URL` (samme Neon som nettsiden), `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Krever at Joakim oppretter Supabase-prosjekt (gratis tier holder) og legger
  inn env-variablene. E-postmal for OTP kan settes opp på norsk i Supabase.

## Utenfor v1

Leads-fane · 2FA · admin-UI for allowlist · dynamisk materialberegning fra
config · roller/rettigheter (alle innloggede ser og kan alt) · varslinger.
