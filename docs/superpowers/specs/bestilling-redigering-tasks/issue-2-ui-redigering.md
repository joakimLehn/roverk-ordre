## Tittel
feat: redigerbar bestilling – skjema på ordredetaljsiden

## Avhenger av
Issue #1 (domenelogikk og datalag) – bruker `saveBestilling`-actionen og
`parseBestillingEdit` derfra.

## Kontekst
Les epic-en (forelder-issuen) og `AGENTS.md` først (særlig
«Mobil først»-seksjonen). Issue #1 har allerede levert
`parseBestillingEdit`, `updateOrderBestilling` og server-actionen
`saveBestilling`. Denne oppgaven bygger UI-et.

## Problem
BESTILLING-seksjonen på `src/app/ordre/[id]/page.tsx` er ren visning.
Ble kledning eller antall dunker avtalt om med kunden, må man i dag
registrere en helt ny ordre for å få riktig materialliste.

## Løsning

**Ekstraher produktfeltene fra `src/app/ordre/ny/NewOrderForm.tsx`** til en
gjenbrukbar komponent, f.eks. `src/components/ProductConfigFields.tsx`:
`SkjulFields`/`VedFields`/`OrdenFields` finnes allerede der som private
funksjoner. Den delte komponenten må ta imot defaults (dagens config) slik
at feltene kan forhåndsutfylles – `NewOrderForm` bruker den videre med
dagens standardverdier og skal oppføre seg nøyaktig som før (samme
feltnavn, samme defaults).

**`src/components/BestillingForm.tsx`** – ny klientkomponent etter samme
mønster som `CustomerForm.tsx` («Rediger kundeinfo»):

- Visning som i dag (definisjonslisten med antall dunker, serie, kledning
  osv. beholdes), med en «Rediger bestilling»-lenke/knapp under.
- I redigeringsmodus vises produktfeltene for ordrens `site`
  (forhåndsutfylt fra `config`), et valgfritt prisfelt forhåndsutfylt med
  `price_nok`, og – kun når config har `manuell: true` – kanalvelger med
  `KANALER`-verdiene. Produkttype vises som låst tekst, ikke som felt.
- Lagre kaller `saveBestilling` fra `src/app/ordre/[id]/actions.ts`;
  valideringsfeil vises i skjemaet på norsk (samme mønster som
  `CustomerForm`/`NewOrderForm`). Avbryt lukker uten å lagre.

**Mobilkrav** (se AGENTS.md): trykkflater minst 46 px høye, `text-base` på
alle inputfelt under `sm`, ingen nedtrekksmeny der bunnark-mønsteret
allerede brukes for hyppige valg – men her er select-felter OK siden
redigering av bestilling er sjeldent, samme avveining som i `NewOrderForm`.

Materiallisten (MATERIALBEHOV) og tittelen/produktteksten trenger ingen
egen håndtering – de deriveres fra `config`/`product` server-side og blir
riktige når `done(id)` revaliderer siden. Verifiser likevel i akseptet.

## Akseptkriterier
- Endring av kledning på en 4-dunk Standard-ordre oppdaterer
  MATERIALBEHOV-listen (Royal ↔ impregnert) uten reload utover
  revalidering
- Endring av antall dunker/serie oppdaterer overskriften («4-dunk
  Standard») på både detaljside og ordreliste
- Nettsideordre: kanal-feltet vises ikke; manuell ordre: kanal kan endres
- `Registrert av`-raden er uendret etter redigering; `redigert_av` vises
  ikke nødvendigvis i UI (ikke et krav), men skal stå i config i databasen
- `NewOrderForm` oppfører seg som før (manuell registrering fungerer)
- `npx tsc --noEmit && npm test && npm run build` er grønt
