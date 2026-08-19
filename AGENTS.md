# AGENTS.md – Roverk Ordre

Kontekst for AI-agenter og utviklere som jobber i dette repoet.

## Hva dette er

Internt ordre-dashboard for Roverk AS (snekkerbedrift i Trondheim som selger
tre produkter: **Skjul** (avfallsskjul), **Ved** (vedskjul) og **Orden**
(garasjeinnredning) via roverk.no). Appen viser innkommende bestillinger og
lar ansatte oppdatere byggstatus, fakturastatus, byggedato, kundeinfo og
notater. Deployes til Vercel som `ordre.roverk.no`.

Design-spec: `docs/superpowers/specs/2026-08-16-roverk-ordre-design.md`
Implementasjonsplan: `docs/superpowers/plans/2026-08-16-roverk-ordre-v1.md`

## Kritisk å forstå: delt database

**Appen eier IKKE databasen.** `orders`- og `leads`-tabellene i Neon Postgres
skrives av roverk.no-nettsiden (eget repo: `roverk as/03-Nettsider`, deployes
separat til Vercel). Denne appen:

- oppretter manuelle ordrer (bestillinger via e-post/Instagram/telefon) med
  `config: { manuell: true, kanal, registrert_av }` – nettsidens ordrer har
  aldri disse config-nøklene
- leser `orders` og oppdaterer KUN kolonnene den selv har lagt til:
  `build_status`, `invoiced_at`, `paid_at`, `is_test`, `planned_build_date`,
  `internal_notes` – pluss kundefeltene (`name`, `phone`, `email`, `address`,
  `preferred_date`) ved eksplisitt redigering
- må ALDRI endre semantikken til nettsidens kolonner (`status`, `config`,
  `utm`, `notify`, `address_meta`) – nettsiden er avsender, vi er mottaker
- alle migreringer skal være idempotente (`add column if not exists`) og
  ligge i `db/migrations/`

## Arkitektur

- **Next.js 15 App Router**, TypeScript, Tailwind v4 (tokens i `globals.css`
  under `@theme` – Roverk-oransje er `--color-brand: #DE7214`)
- **All datatilgang server-side**: Server Components leser, Server Actions
  skriver. Ingen DB-nøkler eller Supabase service-nøkler i klienten.
- **DB**: `@neondatabase/serverless` via `src/lib/db.ts`. Ikke ORM.
  Kolonnenavn i `updateOrderFields` kommer fra en typed whitelist –
  aldri interpolér brukerinput i SQL.
- **Auth**: Supabase e-post-OTP (`@supabase/ssr`). Supabase brukes KUN til
  auth – aldri lagre forretningsdata der. Flyt:
  1. `/login`: e-post sjekkes mot `allowed_emails` i Neon FØR kode sendes
     (svaret er likt uansett, så vi ikke lekker hvem som har tilgang)
  2. `middleware.ts` session-gater alle ruter unntatt `/login`
  3. `requireUser()` (`src/lib/auth.ts`) kalles i hver side/action og
     re-sjekker allowlisten – fjernet ansatt mister tilgang umiddelbart
- **Statusmodell**: to dimensjoner + flagg. `build_status`
  (ny/under_bygging/bygd/montert, fri veksling) er uavhengig av økonomi
  (`invoiced_at`/`paid_at`, tidsstempler). `is_test` skjuler ordren fra
  lister og KPI-er.

## Mobil først

Snekkerne bruker appen stående, med én hånd, ofte med hansker. Derfor:

- Brekkpunktet er **`md:` = 768 px**, ikke `sm:`. Tailwind v4 har `sm` på
  640 px, så alt mellom 640 og 768 (iPad i portrett, delt skjerm) fikk før
  skrivebordstabellen med 13 px avkryssingsbokser. Bruk `md:` for alt som
  gater mobil mot skrivebord.
- Under 768 px rendres ordrelista som kort (`OrderCard`), over som tabell
  (`OrderTable`). Begge kaller de samme server-handlingene.
- Trykkflater skal være minst 44 px høye. Nedtrekksmenyer unngås for
  hyppige valg – bruk bunnark (`StatusSheet`) i stedet.
- Primærnavigasjonen på mobil er `BottomNav` – nederst, i tommelsonen, med
  tallene fra `viewCounts`. Øvre tredjedel av skjermen rekker ikke tommelen,
  så ingenting hyppig skal ligge der. `ViewTabs` er skrivebordets variant.
- Skjemafelt bruker `text-base` på mobil – mindre enn 16 px gjør at iOS
  zoomer inn ved fokus.

## Tilbakemelding og angre

Alt som skriver til databasen fra en liste skal gå gjennom
`useOptimisticField` (`src/components/useOptimisticField.ts`):

- verdien flytter seg med én gang, serveren bekrefter i bakgrunnen
- feiler skrivingen faller verdien tilbake av seg selv (`useOptimistic`), og
  brukeren får en feilmelding – ikke en stille avvist endring
- hver endring gir en toast med **Angre** i 5 sekunder (`ToastProvider`)

Med hansker, stående, er nabotreff normalt. En endring som ikke bekreftes og
ikke kan tas tilbake oppdages først når fakturaen mangler.

`StatusSheet` er en `<dialog>` med `showModal()`. Åpen-tilstanden styres av
React, ikke av dialogens `close`-hendelse: lener man seg på hendelsen kan
Escape lukke elementet uten at React får vite det, og da sitter brikken død.

## Farger og kontrast

Forgrunnsfargene i `@theme` er satt for å klare WCAG AA (4,5:1) mot sin egen
bakgrunn – merkene er 11,5 px halvfet, så 3:1-kravet for stor tekst gjelder
ikke. Endrer du et `--color-*`-par, regn om kontrasten. Bruk aldri `opacity`
for å tone ned innhold som inneholder tekst; det halverer kontrasten på alt
samtidig (testordrer bruker stiplet kant og bakgrunnstone i stedet).

## Regler for endringer

- **TDD for domenelogikk**: alt i `src/lib/` (unntatt db/auth/supabase) og
  `src/data/` skal ha tester i `tests/`. Kjør `npm test`.
- **Materialdata** (`src/data/materials.ts`): transkribert fra plukklistene i
  `roverk as/01-Produkter/*/Kalkyler/`. Prinsipp: **heller ingen liste enn
  feil liste** – returnér `null` når varianten ikke kan avgjøres. Oppdater
  `source`-strengen (med dato) når data endres. Endringer her skal valideres
  av Joakim mot kalkylene.
- **Norsk språk** i all UI-tekst og alle commit-nære kommentarer.
- **Ingen nye avhengigheter** uten god grunn – appen er bevisst liten.
- Verifiser med `npx tsc --noEmit && npm test && npm run build` før du
  melder noe som ferdig.

## Kjente begrensninger / v2-kandidater

- Tersklene i `src/lib/age.ts` (når en ordre er «gammel» per byggstatus) er
  satt etter skjønn, ikke etter avtale – bør bekreftes av Joakim
- Leads-fane (leads-tabellen finnes allerede i samme DB)
- Admin-UI for allowlist (i dag: `node scripts/add-email.mjs <epost>`)
- Dynamisk materialberegning fra ordre-config (mål/tilvalg)
- Orden mangler plukkliste → ingen materialliste
- 2FA / roller (i dag: alle innloggede ser og kan alt)
- Samtidige redigeringer: siste skriving vinner (ok for lite team)

## Miljø

Env-variabler i `.env.local` (se `.env.example`): `DATABASE_URL` (Neon, delt
med nettsiden), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
Uten disse bygger appen, men kjører ikke.
