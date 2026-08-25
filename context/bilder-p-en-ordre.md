# bilder på en ordre

## Decision

# Bilder og vedlegg på ordre

Dato: 2026-08-25 · Status: spec klar til implementering

## Formål

En snekker hos kunden skal kunne **ta bilde i appen** og **laste opp bilder/PDF** på ordren, slik at vi har dokumentasjon på det som er levert. Kontoret skal kunne åpne de samme filene senere ved **reklamasjon**.

Dette er interne vedlegg på en eksisterende ordre. Det er ikke befaring, ikke kundens egen opplasting, og ikke en ny visning i bunnlinja.

## Bakgrunn i koden

- Appen eier ikke `orders`. Den oppdaterer bare egne kolonner, pluss manuelle ordrer med `config.manuell`. Nettsidens kolonner (`status`, `config`, `utm`, `notify`, `address_meta`) røres ikke. (`AGENTS.md`, `context/inspections-app-owned.md`)
- Befaringsfiler ligger allerede i **privat Vercel Blob**; indeks i Neon `inspection_files`; klient → Blob via `handleUpload`; lesing via autentisert rute som redirecter til signert URL ~60 min. (`context/vercel-blob-inspection-files.md`, `context/befaringer.md` beslutning 4)
- Opplasting gjennom Server Action er utelukket: Vercel serverless har ~4,5 MB body, telefonbilder er ofte større.
- Supabase er kun auth. Kundebilder fra hjemmet er forretningsdata. (`context/neon-data-supabase-auth.md`)
- Ordredetalj: `/ordre/[id]` renderer `OrderDetail` i full bredde. Lista på `lg+` viser samme innhold i **compact**-panel (uten notater) og lenken «Åpne hele ordren». Mobilkort lenker rett til `/ordre/[id]`.
- `InspectionHistory` har én «Last opp»-knapp **uten** `capture` (iOS skal kunne velge kamera *eller* bibliotek), galleri, lightbox, slett-bekreftelse og e-postutdrag. Ordre har ikke e-postutdrag; de har `internal_notes`.
- Ingen slett-ordre i denne appen. Siste skriving vinner. (`context/last-write-wins.md`)
- Migreringer: ny fil i `db/migrations/`, idempotent, ledes i `schema_migrations`, kjøres av GitHub Action på `main`. En kjørt fil redigeres aldri. (`context/migrations-ledger-and-ci.md`)
- `orders.id`-typen er nettsidens. `db.ts` caster den ikke. v1-planen behandler id som uuid-streng (`order.id.slice(0, 8)`); `insertManualOrder` oppgir ikke id (database-default).

Støttet på: `context/vercel-blob-inspection-files.md`, `context/inspections-app-owned.md`, `context/befaringer.md`, `context/neon-data-supabase-auth.md`, `context/migrations-ledger-and-ci.md`, `context/mobile-first-field-ui.md`, `context/neon-no-orm.md`, `context/last-write-wins.md`. `inspections-app-owned` sier at `orders`-**kolonner** ikke røres; en tabell vi eier med FK mot `orders.id` er innenfor den rammen.

## Beslutninger

### 1. Egen tabell `order_files`, eid av denne appen

- **Decision:** Ny tabell `order_files` i samme Neon-base. Denne appen har full CRUD. Idempotent migrering `db/migrations/004-order-files.sql`. Ingen nye kolonner på `orders`. Ingen skriving til `config`.
- **Rejected:**
  - **Gjenbruk av `inspection_files`** med nullable `order_id`. Befaring og ordre er ulike objekt; tabellen har `subject`/`body_text` for e-post; cascade fra `inspections` og felles `kind=epost` ville blandet to produkter. `context/befaringer.md` beslutning 5 forbyr ordre-kobling *på befaringen* – det omgjøres ikke her, og det er ikke et argument for å stappe ordrefiler inn i befaringstabellen.
  - **Jsonb-kolonne på `orders`** (`attachments`). Det er en ny kolonne på en tabell vi ikke eier, dårlig å spørre på, og blob-stier hører ikke hjemme i nettsidens rad.
  - **Filstier i `internal_notes`.** Notatfeltet er fritekst for mennesker.
  - **Ny database eller Supabase Storage.** Bryter `context/neon-data-supabase-auth.md`.
- **Reason:** Samme eierskapsmønster som `allowed_emails` og `inspection_files`: det vi oppretter, eier vi. Ordrevedlegg er reklamasjonsbevis og skal kunne leve uavhengig av befaringsseksjonen.
- **Revisit when:** Nettsiden begynner å skrive ordrevedlegg, eller noen slår sammen befaring og ordre til ett saksobjekt.

### 2. Samme Blob-løp som befaring, egne stier og ruter

- **Decision:** Privat Vercel Blob, `BLOB_READ_WRITE_TOKEN` som allerede finnes. Path-prefiks `orders/<order_id>/`. Klient laster direkte via `handleUpload`. Token-rute `POST /api/ordre/upload`. Lesing `GET /ordre/[id]/filer/[fileId]` → `requireUser()` → filen tilhører ordren → **redirect** til signert URL ~60 min. Ingen offentlige Blob-URL-er i HTML. Ingen strømming av byter gjennom Serverless. Ingen ny avhengighet.
- **Rejected:**
  - **Ny bucket / annet objektlager.** Befaring bruker allerede Blob; to lagre gir to hemmeligheter og to feilmodi.
  - **Gjenbruk av `POST /api/befaringer/upload`.** Tokenet skal være bundet til én ordre, ikke en befaring med et flagg. Feil prefiks er en autorisasjonsfeil.
  - **Opplasting gjennom Server Action.** 4,5 MB-grensen.
  - **Offentlig Blob.** Kundebilder fra hjemmet.
- **Reason:** `context/vercel-blob-inspection-files.md` står. Ordrevedlegg er samme klasse data som befaringsvedlegg. Egne ruter holder `inspections/` og `orders/` fra hverandre.
- **Revisit when:** Blob-kost/kvote blir et problem, eller de har et annet privat bucket de vil samle alt i.

### 3. To knapper: Ta bilde og Last opp

- **Decision:** På ordredetaljen, to synlige handlinger (begge ≥ 46 px, `text-base` der det er tekst):
  1. **Ta bilde** — `<input type="file" accept="image/*" capture="environment">`, én fil om gangen. Åpner bakkameraet på telefonen.
  2. **Last opp** — `<input type="file" accept="image/*,application/pdf" multiple>` **uten** `capture`, så iOS/Android kan gi bibliotek, filer og kamera.
- Begge vises på alle brekkpunkt (telefon i landskap er ofte ≥ 768 px; `md:hidden` på «Ta bilde» ville tatt kameraet fra snekkeren).
- Ikke `getUserMedia` og ikke egen lukker-UI.
- **Rejected:**
  - **Bare `capture` på én input.** Da mister vi bildebiblioteket. Snekkeren tar ofte bilder i Kamera-appen først (dårlig dekning) og laster opp etterpå. `context/befaringer.md` avviste `capture` som *default* av samme grunn; her innfrir vi «ta bilde i nettsiden» med en *ekstra* input, ikke ved å fjerne biblioteket.
  - **Bare `accept="image/*"` uten capture.** iOS viser kamera i action sheet, men det er ett ekstra steg med hansker, og operatoren ba om å ta bilde direkte.
  - **Egen kamera-komponent (`getUserMedia`).** Tillatelser, iOS-PWA-sprekk, mer kode. Native `capture` *er* «på nettsiden».
- **Reason:** Feltflyten er ta-bilde-nå; kontorflyten er last-opp-fra-rull. Begge skal være én trykk unna, uten å ødelegge den andre.
- **Revisit when:** De vil ha serie-burst (flere bilder uten å trykke «Ta bilde» på nytt) eller ekte offline-kø.

### 4. Bilder og PDF, ikke video eller kontordokumenter

- **Decision:** Tillatte MIME, identisk med befaring: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/heic`, `image/heif`, `application/pdf`. Maks **15 MB** per fil, maks **40** filer per ordre. `kind` avledes fra `content_type` (PDF → `pdf`, ellers `bilde`). Ikke gjett fra filendelse alene.
- **Rejected:**
  - **Bare jpeg/png.** iPhone lagrer HEIC; det må inn, med samme fallback som befaring (ikke-renderbar → filnavn + Åpne).
  - **Video (`.mov` / `video/mp4`).** Store filer, Blob-kvote, ingen avspiller i appen. Befaring-specen tok dem bevisst ut.
  - **Word/zip/xlsx.** «Vedlegg generelt» i denne appen betyr det snekkeren tar med telefonen pluss en PDF, ikke et arkivformat.
- **Reason:** Reklamasjon trenger bilde av det leverte og av og til en PDF. Listen er allerede implementert og testet for befaring; to lister som driver fra hverandre er en feilkilde.
- **Revisit when:** De ber om film av lekkasje/montering, eller kontoret må legge ved tilbud/kontrakt som `.docx`.

### 5. Ingen kategorier, bildetekst eller e-postutdrag på ordren

- **Decision:** En fil er fil + `created_at` + `created_by` (innlogget e-post) + filnavn. Ingen `levering`/`reklamasjon`-tag, ingen bildetekst, ingen `kind=epost`. Tidslinjen *er* dokumentasjonen. Fritekst hører hjemme i interne notater som allerede finnes.
- **Rejected:**
  - **Mapper eller status per bilde.** Ett ekstra valg per opplasting, med hansker. Operatoren ba om å få bildene inn, ikke om taksonomi.
  - **E-postutdrag som på befaring.** Ordre har notatfelt; å kopiere `InspectionHistory` sin e-postdel inn hit er feil produkt.
- **Reason:** Lav friksjon i felt. Reklamasjon trenger «dette ble tatt da, av den» – det ligger i raden.
- **Revisit when:** De ber om å merke «før / etter utbedring», eller vil lime inn e-posttråd på ordren.

### 6. Opplasting og galleri bare på hele ordresiden, ikke i lista eller compact-panelet

- **Decision:** Seksjonen **Bilder og vedlegg** ligger på `/ordre/[id]` i `OrderDetail` når `compact` er false. Plassering: **rett etter Byggstatus** (merk som montert → ta bilde, uten å scrolle forbi materialliste). Compact-panelet på lista og mobilkortene får **ikke** opplaster, galleri eller fil-telling. Ingen `file_count`-subquery i `listOrders`. Ingen fjerde fane. Ingen opplasting på `/ordre/ny`.
- **Rejected:**
  - **Opplaster i compact-panelet.** Panelet er for å gå gjennom en bunke (status/økonomi). `OrderDetail` kutter allerede notater i compact av samme grunn.
  - **Vedlegg-antall på kort/tabell.** Lista er tett (status, penger, dato, gammel-flagg). «Mangler leveringsbilde» som filter kan komme senere; det er ikke denne specen.
  - **FAB.** Appen har ikke flytende knapper; to store knapper i seksjonen holder.
  - **Tvinge bilde før `montert`.** Ville stanset folk uten dekning eller når produktet ikke er synlig ennå.
- **Reason:** Snekkeren i felt åpner `/ordre/[id]` fra kortet. Kontoret som fakturerer bruker panelet og trykker «Åpne hele ordren» når de trenger bildene. `listOrders` forblir billig.
- **Revisit when:** De vil se hvilke monterte ordrer som mangler bilder, eller ta bilde uten å forlate lista.

### 7. Samme slett- og feilkontrakt som befaring

- **Decision:** Opplasting er **ikke** optimistisk: vis filnavn + spinner til Blob **og** rad finnes. Feil på én fil stopper ikke de andre. Toast: «Kunne ikke laste opp \<navn\>.» Slett: `ConfirmDialog` («Slett vedlegget?»), **ikke** toast-angre. Blob først, deretter rad; feilet blob-slett stopper ikke rad-slett. Uten rad vises ikke filen; orphan blob er akseptabelt. Uten `BLOB_READ_WRITE_TOKEN`: appen bygger; opplasting feiler med synlig norsk melding (`BLOB_TOKEN_MISSING`).
- **Rejected:** Optimistisk slett (Blob er ikke trivielt å gjenopprette). Stille avvist opplasting.
- **Reason:** `context/befaringer.md` beslutning 7 og AGENTS.md om hansker/nabotreff. Et slettet leveringsbilde er verre enn en feil statusbrikke.
- **Revisit when:** Soft-delete med utsatt Blob-sletting blir verdt det.

### 8. Del opplastingsregler, ikke befarings-UI

- **Decision:** Trekk felles MIME/størrelse/antall/`kindFromContentType`/`isRenderableImage`/`deleteBlobThenRecord` ut i `src/lib/upload.ts` (eller tilsvarende). Befaring importerer derfra slik at listene ikke driver. Ny `src/lib/order-file.ts` for ordre-sti, parse av upload-payload, href. Ny klientkomponent `OrderAttachments` – **ikke** gjenbruk `InspectionHistory` (den eier e-postutdrag). Generaliser `ImageLightbox` til `src` + `filename` + `onClose` + `onDelete` (åpen-tilstand i React, samme regel som `StatusSheet`). Gjenbruk `inspection-blob.ts` for signert URL, slett og «token mangler» (oppførselen er ikke befaringsspesifikk). Gjenbruk `ConfirmDialog`.
- **Rejected:**
  - **Kopiere MIME-listen inn i en ordremodul.** To kilder til «hva er lov».
  - **Én felles `AttachmentHistory`-komponent med `mode: ordre | befaring`.** Flagget blir e-post-UI og feil `capture`. To tynne komponenter er billigere enn en med hemmelige grener.
- **Reason:** Sikkerhetsreglene skal være én. UI-et skal følge flaten det står på.
- **Revisit when:** En tredje opplaster (f.eks. leads) gjør felles UI verd å betale for.

## Datamodell

Migrering `db/migrations/004-order-files.sql` (idempotent). Ingen `alter table orders`. Ingen `drop`. Ingen `$$`-blokk med semikolon (migrate-skriptet splitter på `;`).

```sql
create table if not exists order_files (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by text,
  kind text not null,
  filename text not null,
  content_type text,
  byte_size integer,
  blob_pathname text not null
);

create index if not exists order_files_order_idx
  on order_files (order_id, created_at);
```

`order_id` er `uuid` og FK mot `orders(id)` fordi v1-planen behandler id som uuid-streng og `insertManualOrder` lar basen sette id. Hvis migreringen feiler fordi `orders.id` ikke er uuid: sett `order_id` til **samme type som `orders.id`** og behold FK + `on delete cascade`. Ikke dropp FK for å unngå type-spørsmålet. Ikke rediger filen etter at den er kjørt – da ny fil.

Tillatte `kind` (håndheves i `src/lib/`, ikke nødvendigvis som DB-check): `bilde`, `pdf`.

Regler:

- Rad uten `blob_pathname` finnes ikke (ingen e-post-kind).
- `filename` trimmet, tom → `'fil'`.
- Opplasting krever at `getOrder(orderId)` finnes; ellers ingen token og ingen insert.
- Blob-sti må starte med `orders/<orderId>/`, være lengre enn prefikset, og ikke inneholde `..` eller ekstra `/` i id-delen.
- `orderId` i URL/payload er en ugjennomsiktig id fra `orders`; avvis tom, `/` og `..`. Eksistens sjekkes med `getOrder`, ikke med gjetning.
- Listing: `order by created_at asc` (eldste først – leveringslogg ovenfra).
- Slett av ordre skjer ikke i denne appen. Hvis nettsiden sletter en ordre, fjerner cascade radene; tilhørende blobs kan bli orphan. Det er akseptabelt (sjeldent). Ikke bygg en trigger mot Blob.
- Kolonnenavn i SQL interpoleres aldri fra brukerinput. (`context/neon-no-orm.md`)

Denne appen eier `order_files`. Nettsidens kolonner røres ikke.

Oppdater `AGENTS.md` og `README.md`: appen eier også `order_files`; Vercel Blob er befarings- **og** ordrevedlegg, ikke «kun befaringsvedlegg».

## Filer og lagring

**Flyt (klient → Blob → Neon):**

1. Innlogget bruker trykker **Ta bilde** eller **Last opp**.
2. For hver fil: klienten avviser lokalt hvis `size > 15 MB` eller (når `file.type` er satt) typen ikke gir `bilde`/`pdf`. Deretter `upload` fra `@vercel/blob/client` mot `handleUploadUrl: '/api/ordre/upload'`, `access: 'private'`, pathname `orders/<orderId>/<filnavn>`, `clientPayload: JSON.stringify({ orderId })`.
3. `onBeforeGenerateToken`: `requireUser()`, parse payload + sti, `getOrder`, `countOrderFiles` + `validateUploadFileCount`, returner `allowedContentTypes`, `maximumSizeInBytes`, `addRandomSuffix: true`.
4. `onUploadCompleted` kan være tom (localhost treffer den ikke; raden er kilden til visning) – samme kommentar som befaringsruten.
5. Klienten kaller server action som validerer MIME/størrelse/antall/sti på nytt og setter inn `order_files` med `created_by = sesjons-e-post`. Uten rad skal ikke filen vises.
6. `revalidatePath('/')` og `revalidatePath('/ordre/[id]')`.
7. Feil på én fil stopper ikke de andre.

**Lesing:** Ingen `blob_pathname` i HTML (klienttype uten det feltet, som `toClientFileView`). `src` på `<img>` og PDF-lenke er `/ordre/[id]/filer/[fileId]`. PDF: `target="_blank"`. Ingen `next/image` mot private URL-er.

**Forhåndsvisning:** Renderbare bilder (`jpeg`/`png`/`webp`/`gif`) i rutenett, 2 kolonner under `md:`, 3 over, kvadratiske thumbs, `object-cover`, `loading="lazy"`. Trykk åpner generalisert `ImageLightbox` (knapp, klikk utenfor, Escape – åpen-tilstand i React). Lightbox viser filnavn, dato (`formatDateNo(created_at)`) og `created_by` hvis satt, pluss Lukk og Slett. HEIC/HEIF og andre ikke-renderbare bilder, samt PDF: rad med filnavn, dato, Åpne, Slett – ikke innebygd viewer.

**Ikke i denne specen (bevisst):** komprimering, server-thumbnails, EXIF-parsing/stripping (inkl. GPS – vi viser det ikke; vi rører ikke bytene), virus-scan, mapper, annotasjon, offline-kø.

## Domenelogikk (`src/lib/`)

Ny modul `order-file.ts` + felles `upload.ts`, tester i `tests/`. TDD. Befaringens eksisterende tester skal fortsatt gå – oppdater importer, ikke oppførsel.

Minst:

- `orderBlobPrefix(orderId)` → `orders/<orderId>/`
- `isOrderBlobPath(orderId, pathname)`
- `parseOrderUploadRequest(pathname, clientPayload)` → `{ orderId }` eller norsk feil
- `orderFileHref(orderId, fileId)` → `/ordre/<orderId>/filer/<fileId>`
- `toClientOrderFileView` uten `blob_pathname`
- `validateUploadFile` / `validateUploadFileCount` med feiltekst «For mange filer. Maks 40 per ordre.» når entity er ordre
- `isRenderableImage` uendret semantikk (jpeg renderer, heic ikke)

Ikke trekk `groups.ts` eller ordrevisninger inn i dette. Ingen endring i KPI, `applyView`, eller `BottomNav`.

`db.ts`: `listOrderFiles`, `getOrderFile`, `countOrderFiles`, `insertOrderFile`, `deleteOrderFile`. Ikke utvid `ORDER_COLS`. Ikke subquery i `listOrders`.

## UI

Norsk. Roverk-oransje uendret. `md:` = 768. Ingen `opacity` på tekst. Trykkflater ≥ 44 px (knappene 46 px som resten av detaljsiden).

### `/ordre/[id]` (full)

Etter seksjonen Byggstatus, før Økonomi:

**Bilder og vedlegg**

- Tomtilstand under knappene, synlig når det ikke er filer og ingenting lastes opp: «Ingen bilder ennå. Ta bilde av det som er levert, så har vi det ved reklamasjon.»
- Knappene i kolonne, `gap-2`, full bredde:
  - **Ta bilde** — `bg-brand`, hvit tekst, `font-bold`
  - **Last opp** — hvit bakgrunn, `border-line` (sekundær; PDF og bibliotek)
- Skjulte file-inputs (`sr-only`) inni `<label>` / knapp, som på befaring.
- Under opplasting: filnavn + spinner per fil.
- Deretter galleri, deretter andre-filer-rader.

`OrderDetail({ compact: true })` renderer ikke seksjonen, selv om `files` sendes inn. Lista trenger ikke hente filer.

### `/ordre/ny`

Ingen filopplasting. Først lagre ordren, så vedlegg på detaljsiden (samme som befaring).

### Liste `/`

Ingen endring i kort, tabell, KPI, filter eller bunnlinje.

## Auth og sikkerhet

- Middleware dekker allerede nye ruter unntatt statiske ikoner.
- Hver page/action/upload/download kaller `requireUser()` og re-sjekker allowlisten.
- Token uten gyldig ordre → feil, ingen opplasting.
- Fil-ID i URL er nok; ikke lek `blob_pathname` til klienten.
- Signerte URL-er er tidsbegrensede capability-lenker – ikke logg dem med vilje.
- Alle innloggede ser og kan alt, som i dag. Ingen nye roller.
- `robots: noindex` er allerede på layout.

## Miljø og drift

Ingen ny env. `BLOB_READ_WRITE_TOKEN` er allerede dokumentert. Utvid README-setningen så det også gjelder ordrevedlegg.

Ingen ny Vercel-domene. Ingen endring i Supabase. Ingen endring i nettside-repoet.

Migrering 004 kjøres av eksisterende GitHub Action når den lander på `main`.

## Feilhåndtering

- DB nede: samme som i dag.
- Opplasting: per-fil, resten fortsetter.
- Maks størrelse/antall/MIME: norsk feilmelding på klient når mulig, alltid på server.
- Manglende ordre ved opplasting: feil, ingen token.
- Manglende token: synlig melding, metadata/liste (tom) vises.

## Testing

Vitest for `src/lib/upload.ts` og `src/lib/order-file.ts` (parse, sti, MIME, størrelse, antall, client view uten pathname, deleteBlobThenRecord). Migreringstest etter mønsteret i `tests/inspections-migration.test.ts`: `if not exists`, oppretter `order_files` og indeksen, **ingen** `alter table orders`, **ingen** `drop`. FK mot `orders` er tillatt og skal synes i SQL-en.

Ikke integrasjonstest mot ekte Blob eller Neon.

Befaringstester skal forbli grønne etter uttrekket av felles upload-regler.

Før ferdig: `npx tsc --noEmit && npm test && npm run build`.

Manuell verifisering (når Blob-token finnes): på telefon, PWA eller Safari – Ta bilde (kamera) og Last opp (bibliotek + PDF); åpne lightbox; slett med bekreftelse; avbryt slett; last opp to filer der én er for stor og se at den andre går gjennom; åpne PDF i ny fane; bekreft at compact-panelet ikke viser seksjonen og at `/befaringer/[id]` fortsatt laster opp som før.

Uten Blob-token: synlig feil ved opplasting, ingen krasj på detaljsiden.

## Utenfor denne specen

- Video, Word, zip, mapper, bildetekst, annotasjon, OCR
- E-postutdrag på ordre
- Kobling mellom befaring og ordre (kopiere befaringsbilder, `order_id` på `inspections`)
- Påkrevd bilde for å sette `montert`
- Fil-telling eller kamera-ikon på listekort/tabell
- Filter «monterte uten bilde»
- Opplasting på `/ordre/ny` eller i compact-panelet
- Offline-kø, klientkomprimering, server-thumbnails, EXIF/GPS-visning
- Slett ordre, TTL/auto-slett (reklamasjon – filer ligger til noen sletter dem)
- Roller, 2FA, kundetilgang til bildene
- Endring av KPI, materiallister, `BottomNav`, eller befaringsopplastingens oppførsel utover felles `upload.ts`
- Admin-UI for Blob-kvote
- Nye npm-pakker

At noe av dette mangler er ikke en implementasjonsfeil.

## Rejected

Not recorded separately in the specification.

## Reason

See Decision.

## Status

stated

## Evidence

#30

## Source

https://github.com/joakimLehn/roverk-ordre/issues/30

## Revisit when

When the specification no longer holds.
