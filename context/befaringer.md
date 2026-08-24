# Befaringer

## Decision

# Befaringer

Dato: 2026-08-24 · Status: utkast til implementering

## Formål

Snekkere og kontoret skal ha en **egen seksjon**, uavhengig av ordrene, for kunder som tar kontakt (e-post, telefon, sosiale medier) med særlige behov og som vil ha **befaring på stedet**.

På telefonen, stående, skal den som skal ut kunne se **hvem**, **hvor**, **telefon** og **når det er avtalt**, og åpne **bilder, PDF-er og e-postutdrag** som noen har lagt inn manuelt.

Dette er **ikke** leads-fanen som er nevnt som v2 i `AGENTS.md` og v1-specen. `leads`-tabellen eies av nettsiden; vi rører den ikke.

## Bakgrunn i koden

- Appen eier ikke `orders`/`leads`. Den oppdaterer bare egne ordrekolonner, pluss manuelle ordrer med `config.manuell`.
- Ingen filopplasting, blob-lagring eller vedleggstabell finnes i dag.
- Navigasjon: `ViewTabs` / `BottomNav` er **ordrevisninger** (`bygge` / `fakturere` / `alle`), ikke app-seksjoner. `+` går til `/ordre/ny`.
- Detalj: `ContactActions` (Ring / Veibeskrivelse), `CustomerForm`, `NotesForm`, `StatusSheet`, `useOptimisticField`, toast med Angre.
- Auth: `requireUser()` + allowlist. Alle innloggede ser og kan alt.
- Mobil: `md:` = 768, kort under, trykkflate ≥ 44 px, `text-base` på skjemafelt, ingen `opacity` på tekst.

## Beslutninger

### 1. Egen tabell `inspections`, eid av denne appen

- **Decision:** Ny tabell `inspections` + `inspection_files` i samme Neon-database. Denne appen har full CRUD. Idempotent migrering i `db/migrations/`.
- **Rejected:**
  - **Ordrer med et flagg / `build_status`.** Befaring er ikke en ordre. Den ville forurenset «Å bygge», KPI-er, materialliste og `config`-semantikk, og krevd et produkt som ofte ikke er avklart.
  - **`leads`-tabellen.** Den eies av nettsiden. Vi kjenner ikke skjemaet herfra, og v1-specen forbyr å endre nettsidens semantikk. En leads-fane er et annet produkt (nettside-henvendelser uten avtalt besøk).
  - **Ny database.** Bryter `context/neon-data-supabase-auth.md`.
- **Reason:** Operatoren ba om en seksjon uavhengig av ordrene. Tabeller vi selv oppretter (som `allowed_emails`) er den etablerte måten å eie data på i den delte basen.
- **Revisit when:** Nettsiden begynner å skrive befaringer, eller noen vil slå sammen leads og befaringer etter å ha lest `leads`-skjemaet i `03-Nettsider`.

### 2. Egen rute `/befaringer`, ikke en fjerde ordre-fane

- **Decision:** App-seksjon med URL `/befaringer`, `/befaringer/ny`, `/befaringer/[id]`. **Seksjonsvalg i header** (Ordrer | Befaringer) på alle innloggede sider. `BottomNav` på `/befaringer` får egne visninger (Kommende / Ferdig / Alle) + `+`. Ordre-`BottomNav` endres ikke.
- **Rejected:**
  - **Fjerde item i eksisterende `BottomNav`.** Den er tre ordrevisninger + ny ordre. Befaring er et annet objekt; å blande det med «Å fakturere» klemmer tommelfeltet og ødelegger visningstallene.
  - **Bytte `BottomNav` til Ordrer | Befaringer og flytte Å bygge/Å fakturere/Alle til chips.** Det er den hyppigste handlingen i felt i dag; den skal bli værende i tommelsonen (`context/mobile-first-field-ui.md`).
  - **Bare lenke i header uten egen `BottomNav` på befaringssiden.** Da mister kommende/ferdig det samme mønsteret snekkeren allerede kan.
- **Reason:** Seksjonsbytte skjer sjelden (før turen). Visningsbytte skjer ofte. Header for det første, bunnlinje for det andre – per seksjon.
- **Revisit when:** Befaring blir like hyppig som «Å bygge» og trenger en fast plass i tommelsonen på ordresiden.

### 3. Én status + avtalt dato/klokke, ikke todimensjonal ordrestatus

- **Decision:** `status`: `aktiv` | `gjennomfort` | `avlyst` (fri veksling, `StatusSheet`). Avtale: `scheduled_on` (`date`, Oslo-kalenderdag, samme idé som `planned_build_date`) og valgfri `scheduled_time` (`time`, Oslo-lokal, ingen tidssone i verdien).
- **Rejected:**
  - **Bare dato, ingen status.** Lista fylles med gamle besøk; snekkeren ser ikke hva som gjenstår.
  - **`ny` vs `avtalt` som to statuser.** Datoen *er* avtalen. Uten dato ligger raden i gruppa «Uten dato».
  - **`timestamptz` alene.** Midnatt som «ingen klokke» er tvetydig. Ordre-datoer sammenlignes allerede som `YYYY-MM-DD` for å unngå UTC-drift (`groups.ts` / `osloDate`).
  - **Todelingsmodellen fra ordrer (bygg + økonomi).** Befaring har ikke faktura/betalt.
- **Reason:** Feltspørsmålet er «hva skal jeg i dag». Status skiller åpne fra ferdige; dato+klokke sier når.
- **Revisit when:** De trenger tildeling av hvem som kjører, eller gjentakende befaringer.

### 4. Filer i Vercel Blob (privat), metadata og e-postutdrag i Neon

- **Decision:** `@vercel/blob`, **private** blobs. Indeks i `inspection_files`. Direkte opplasting fra klienten til Blob (signert token fra oss) fordi Vercel serverless har ~4,5 MB request-body – telefonbilder er ofte større. E-postutdrag er **innlimt tekst** (ingen `.eml`-parser), valgfritt emne; `kind = epost` uten blob. Bilder/PDF: `kind = bilde | pdf`.
- **Rejected:**
  - **Supabase Storage.** `context/neon-data-supabase-auth.md` og `AGENTS.md`: Supabase er kun auth, aldri forretningsdata. Kundebilder fra hjemmet er forretningsdata.
  - **`bytea` i Postgres.** Dårlige for 20 MB PDF-er; Neon er ikke objektlager.
  - **Bare lenker til Dropbox/Drive.** Operatoren ba om opplasting i appen, slik at snekkeren har historikken uten å bytte app.
  - **Opplasting gjennom Server Action.** Treffer plattformens body-grense.
  - **Ny PDF-/bildebibliotek-avhengighet.** Nettleseren viser PDF; `<img>` viser vanlige bilder.
- **Reason:** Blob er det som passer et Vercel-prosjekt uten å bryte auth-grensen. Ny avhengighet `@vercel/blob` er begrunnet (AGENTS.md: ingen nye deps uten grunn).
- **Revisit when:** De allerede har et annet privat bucket de vil bruke, eller Blob-kost/kvote blir et problem.

### 5. Ingen kobling til ordre i denne versjonen

- **Decision:** En befaring blir ikke til en ordre i appen. Etter befaring registreres eventuell bestilling som i dag via `/ordre/ny`.
- **Rejected:** «Opprett ordre fra befaring», `order_id`-FK, kopiering av kundeinn i `orders`.
- **Reason:** Operatoren ba om uavhengighet. Automatisk insert i `orders` er lett å gjøre feil mot nettsidens kolonner. Manuell ordre finnes allerede.
- **Revisit when:** De ber om å slippe å taste kunden to ganger, eller vil se «denne befaringen ble ordre X».

### 6. Samme tilgang som ordrer; siste skriving vinner

- **Decision:** `requireUser()` på alle sider, actions og fil-ruter. Ingen nye roller. Samtidige redigeringer: siste skriving vinner (`context/last-write-wins.md`).
- **Rejected:** Egen «befaringsrolle»; optimistic locking.
- **Reason:** Lite team, samme app.
- **Revisit when:** 2FA/roller tas opp (allerede v2-kandidat).

### 7. Status/dato/notater med toast+angre; filsletting med bekreftelse

- **Decision:** Listefelt som skriver til DB går gjennom `useOptimisticField` (eller samme mønster) med toast og Angre i 5 s. Opplasting viser fremdrift per fil, ikke optimistisk «filen er der» før Blob+rad er OK. Slett fil / slett befaring: bekreftelsesdialog (to store knapper), **ikke** toast-angre.
- **Rejected:** Optimistisk filsletting (Blob er ikke trivielt å gjenopprette). Stille avvist opplasting.
- **Reason:** AGENTS.md om hansker og nabotreff. En slettet kundebilde-fil er verre å angre enn en statusbrikke.
- **Revisit when:** Soft-delete med utsatt Blob-sletting blir verdt kompleksiteten.

## Datamodell

Migrering `db/migrations/003-inspections.sql` (idempotent). Tabellnavn på engelsk som `orders`; UI på norsk.

```sql
create table if not exists inspections (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by text,
  name text not null,
  phone text,
  email text,
  address text,
  scheduled_on date,
  scheduled_time time,
  status text not null default 'aktiv',
  product text,
  channel text,
  notes text,
  updated_at timestamptz not null default now()
);

create index if not exists inspections_status_on_idx
  on inspections (status, scheduled_on);

create table if not exists inspection_files (
  id uuid primary key default gen_random_uuid(),
  inspection_id uuid not null references inspections (id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by text,
  kind text not null,
  filename text not null,
  content_type text,
  byte_size integer,
  blob_pathname text,
  subject text,
  body_text text
);

create index if not exists inspection_files_inspection_idx
  on inspection_files (inspection_id, created_at);
```

Tillatte verdier (håndheves i `src/lib/`, ikke nødvendigvis som DB-check i v1):

| Felt | Verdier |
|---|---|
| `status` | `aktiv`, `gjennomfort`, `avlyst` |
| `product` | `skjul`, `ved`, `orden`, `annet`, eller `null` |
| `channel` | samme som `KANALER` i manuell ordre: E-post, Instagram, Facebook, Telefon, Annet |
| `kind` | `bilde`, `pdf`, `epost` |

Regler:

- `name` trimmet, påkrevd.
- E-post via eksisterende `normalizeEmail`; ugyldig → feil, tom → `null`.
- `scheduled_on`: `YYYY-MM-DD` eller `null`.
- `scheduled_time`: `HH:MM` eller `null`. Tid uten dato er ugyldig (lagre ikke tid alene).
- `kind = epost` krever `body_text` (maks 50 000 tegn etter trim); `blob_pathname` er `null`.
- `kind = bilde|pdf` krever `blob_pathname`; `body_text` er `null`.
- Oppdatering av inspections: kolonne-whitelist i `db.ts`, samme mønster som `updateOrderFields` (`context/neon-no-orm.md`). Sett `updated_at = now()` ved hver oppdatering.
- Slett befaring: `delete from inspections where id = $1` (cascade filrader) og slett tilhørende blobs best-effort. Feilet blob-slett er ikke brukersynlig feil hvis DB-raden er borte.

Denne appen eier begge tabellene. Nettsidens kolonner røres ikke.

## Filer og lagring

**Tillatte opplastinger:** `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/heic`, `image/heif`, `application/pdf`. Maks **15 MB** per fil, maks **40 filer** per befaring (epost-rader teller med).

**Avled `kind`:** PDF → `pdf`, ellers `bilde`. Ikke gjett fra filendelse alene; bruk `content_type` fra Blob-opplastingen, avvis resten.

**Flyt (klient → Blob → Neon):**

1. Innlogget bruker velger én eller flere filer (`<input type="file" accept="image/*,application/pdf" multiple>`). Ikke `capture` som default – iOS-velgeren skal kunne gi kamera *eller* bildebibliotek.
2. For hver fil: klienten ber om opplastingstoken via autentisert rute (f.eks. `POST /api/befaringer/opplasting`). Serveren sjekker sesjon, at befaringen finnes, antall filer, MIME og størrelse, og kaller `handleUpload` fra `@vercel/blob/client`.
3. Klienten laster direkte til Blob, `access: 'private'`, `addRandomSuffix: true`. Path-prefiks: `inspections/<inspection_id>/`.
4. Klienten kaller en server action som setter inn `inspection_files`. Uten rad skal ikke filen vises; en orphan blob er akseptabelt som sjelden lekkasje.
5. Feil på én fil stopper ikke de andre. Toast ved feil: «Kunne ikke laste opp \<navn\>.»

**Lesing:** Ingen offentlige Blob-URL-er i HTML. Authentisert rute `GET /befaringer/[id]/filer/[fileId]` (eller `/api/...`) som `requireUser()`, sjekker at filen tilhører befaringen, og **redirecter** til signert URL med ~60 min levetid. Brukes som `src` på `<img>` og som lenke for PDF (`target="_blank"`). Ikke strøm 15 MB gjennom Serverless.

**E-postutdrag:** Skjema på detaljsiden: valgfritt emne + textarea (text-base, min. 44 px lagre-knapp). Lagres som `kind=epost`. Vises som kort, `whitespace-pre-wrap`, nyeste nederst eller eldste først – **eldste først** (tråden leses ovenfra).

**Slett fil:** Bekreft («Slett vedlegget?»). Slett Blob så DB-rad. Hvis Blob feiler, slett raden likevel og vis feil bare hvis DB feiler.

**Forhåndsvisning:** Bilder i rutenett (2 kolonner under `md:`, 3 over), kvadratiske thumbs, `object-cover`, `loading="lazy"`. Trykk åpner `<dialog>` med bildet (lukk via knapp, klikk utenfor, Escape – åpen-tilstand i React, samme regel som `StatusSheet`). HEIC som ikke renderer: vis filnavn + «Åpne» (signert URL). PDF: rad med filnavn og åpne-lenke, ikke innebygd viewer. Ingen `next/image`-avhengighet av private URL-er i v1.

**Ikke i v1:** komprimering, thumbnails på server, virus-scan, mapper, redigering av filinnhold.

## Domenelogikk (`src/lib/`)

Ny modul, f.eks. `src/lib/inspection.ts` + `src/lib/inspection-groups.ts`, med tester i `tests/`. Ikke trekk `groups.ts` om til union-typer; kopier/speil datobøttene så ordretestene står i fred. Gjenbruk `osloDate`.

**Visninger** (`InspectionViewKey`):

| Nøkkel | Innhold | Standard |
|---|---|---|
| `kommende` | `status = aktiv` | ja (`/befaringer`) |
| `ferdig` | `gjennomfort` eller `avlyst` | |
| `alle` | alle | |

URL: `/befaringer` og `/befaringer?vis=ferdig|alle` (ikke `view=`, så det ikke kolliderer mentalt med ordre-`view` hvis noen kopierer kode feil). `q` for søk.

**Søk:** case-insensitive i navn, telefon, e-post, adresse.

**Gruppering (kun kommende), samme nøkler som bygging:** Forfalt / I dag / Denne uka / Senere / Uten dato. `scheduled_on` mot `osloDate(now)`. Innenfor gruppe: tidligste dato, så tidligste klokke (`null` tid sist), så `created_at`. Forfalt vises med samme farefarge-mønster som stale/forfalt på ordrer (farge, ikke opacity).

**Ferdig:** usgruppert, sorter `created_at` synkende (logg).

**Alle:** usgruppert, `created_at` synkende.

**Parse opprett/rediger:** ren funksjon, samme stil som `parseManualOrder`. Påkrevd: navn. Resten valgfritt med validering over. Produkt og kanal utenfor whitelist → `annet` / `Annet` eller avvis – **avvis ukjent produkt/kanal** med feilmelding, ikke gjett.

**Filvalidering:** MIME, størrelse, antall, e-postlengde – rene funksjoner + tester.

## UI

Norsk. Roverk-oransje uendret. `md:`-brudd. Header-logo kan fortsette å gå til `/`; produktnavnet forblir «ROVERK. Ordre».

### Header (alle innloggede sider)

Etter logo: to lenker **Ordrer** (`/`) og **Befaringer** (`/befaringer`). Aktiv seksjon: `aria-current="page"` og samme synlige aktiv-stil som `ViewTabs` (fylt/mørk vs. kant). Trykkflate minst 44 px høy. På mobil er dette et **sjelden** seksjonsbytte – det er bevisst ikke i `BottomNav`.

Ikke legg hyppige handlinger (status, opplasting) i header.

### Liste `/befaringer`

- **Mobil:** kort. Tittel = kundenavn. Under: adresse eller «Mangler adresse»; avtalt som «i dag kl. 14:00», «24. aug. kl. 10:00», «24. aug.» (uten klokke), eller «Ikke avtalt». Statusbrikke. Hvis filer: diskret «N vedlegg». Hele kortet (unntatt statusbrikke) er lenke til detalj.
- **Skrivebord (`md:`):** tabell, ikke sidepanel. Kolonner: avtalt, kunde, adresse, telefon, status, vedlegg-antall. Rad klikkes til `/befaringer/[id]`. Ingen ordre-sidepanel: vedlegg trenger hele siden.
- Status på kort/rad: åpner `StatusSheet` med tre valg (Aktiv / Gjennomført / Avlyst), optimistisk + Angre.
- `BottomNav` (kun denne lista, `md:hidden`): Kommende / Ferdig / Alle med tellinger, + `+` til `/befaringer/ny`. Fast nederst, `safe-area`. Hovedinnhold har samme bunnpolstring som ordresiden.
- `ViewTabs` på `md+` med samme tre visninger.
- Søkefelt som ordrefilteret (text-base på mobil).
- Tomtilstand via `EmptyState`: f.eks. «Ingen kommende befaringer.» med «+ Ny befaring» og evt. «Se alle».
- Ingen KPI-rad og ingen pengesammendrag.

Skrivebordstittel: «Befaringer» + knapp «+ Ny befaring».

### Ny `/befaringer/ny`

Samme layout-rytme som `/ordre/ny`: tilbake-lenke, skjema `max-w-xl`, felt `min-h-[46px]`, `text-base md:text-sm`.

Felt: Navn *; Telefon; E-post; Adresse; Avtalt dato; Klokkeslett; Produkt (Velg… / Skjul / Ved / Orden / Annet); Kanal (samme select som manuell ordre); Internt notat.

Lagre → redirect til `/befaringer/[id]` (så kontoret kan legge ved filer med en gang). Ingen filopplasting på opprett-skjemaet.

Ingen `BottomNav` her (som på `/ordre/ny`).

### Detalj `/befaringer/[id]`

Ingen `BottomNav`. Tilbake: «← Befaringer». Tittel: kundenavn. Underlinje: produktlabel hvis satt, kanal, opprettet-dato.

Rekkefølge:

1. **Ring / Veibeskrivelse** – samme mønster som `ContactActions` (SVG, ikke emoji, `min-h-[46px]`). Trekk ut felles props `{ phone, address }` hvis det unngår duplikat; **ikke** tving `Order`-typen på befaring.
2. **Status** – tre store valg eller brikke + sheet, fri veksling, toast+angre. På `aktiv`: primærknapp «Merk som gjennomført» (min. 44 px) i tillegg, samme action.
3. **Avtalt** – date + time, lagres som ordre-byggedato (onchange/action). Tøm dato → tøm også tid.
4. **Kunde** – visning + «Rediger kundeinfo» som `CustomerForm` (navn, telefon, e-post, adresse, produkt, kanal).
5. **Historikk** – underoverskrifter:
   - **Vedlegg:** last opp-knapp (stor), deretter galleri/liste. Under opplasting: filnavn + spinner.
   - **E-poster:** eksisterende utdrag + «Lim inn e-post».
6. **Internt notat** – samme som `NotesForm` (textarea + Lagre).
7. **Slett befaring** – sekundær, ødeleggende, bekreftelse. Redirect til lista.

`notFound()` hvis id mangler.

## Auth og sikkerhet

- Middleware slår allerede alt unntatt `/login` og ikoner. Nye ruter dekkes.
- Hver page/action/upload/download kaller `requireUser()` og re-sjekker allowlisten.
- Fil-ID i URL er nok; ikke lek `blob_pathname` til klienten unødvendig (kan ligge i serverkode).
- Signerte URL-er er tidsbegrensede; de er capability-lenker – ikke logg dem i klient-logger med vilje.
- `robots: noindex` er allerede på layout.

## Miljø og drift

Ny env, dokumenter i `.env.example` og README:

- `BLOB_READ_WRITE_TOKEN` – fra Vercel Blob på prosjektet som deployer `ordre.roverk.no`.

Uten token: app **bygger** og lister/metadata fungerer; opplasting feiler med synlig melding. Samme filosofi som manglende `DATABASE_URL` (bygger, kjører ikke).

Joakim (eller den som eier Vercel) må opprette Blob-store og sette token på preview+prod. Lokal `.env.local` for dev.

Ingen ny Vercel-domene. Ingen endring i Supabase.

## Feilhåndtering

- DB nede: samme som i dag (feil, ingen halv lagret status-oppdatering – én UPDATE per handling).
- Opplasting: per-fil feil, resten fortsetter.
- Maks størrelse/antall/MIME: norsk feilmelding før nettverk der det er mulig (klient + server).
- Manglende befaring ved opplasting: feil, ingen token.

## Testing

Vitest for `src/lib/` (parse, visningsfilter, gruppering, filregler, status-whitelist). Ikke integrasjonstest mot ekte Blob eller Neon i v1 (samme som ordre-specen).

UI-kontrast: ingen nye fargepar uten AA mot egen bakgrunn. Avlyst: `muted` på sand/white, ikke opacity.

Før ferdig: `npx tsc --noEmit && npm test && npm run build`.

## Utenfor denne specen

- Leads-fane og all lesing/skriving av `leads`
- Opprette eller oppdatere `orders` fra en befaring
- Tildeling («hvem kjører»), kalender-sync, varsler, e-postinnboks-integrasjon
- Automatisk import av e-post/IMAP/Gmail
- Mapper, merknader på selve bildet, tegning/annotasjon
- Roller, 2FA, egen allowlist for befaringer
- Offline-kø for opplasting
- Søke i filinnhold / OCR
- Word/zip/video (`.docx`, `.zip`, `.mov` osv.)
- Admin-UI for Blob-kvote
- Endring av ordre-KPI, materiallister, eller `BottomNav` på `/`

At noe av dette mangler er ikke en implementasjonsfeil.

## Rejected

Not recorded separately in the specification.

## Reason

See Decision.

## Status

stated

## Evidence

#10

## Source

https://github.com/joakimLehn/roverk-ordre/issues/10

## Revisit when

When the specification no longer holds.
