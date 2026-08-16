# Roverk Ordre

Internt ordre-dashboard for [Roverk](https://www.roverk.no) – viser alle
innkommende bestillinger fra nettsiden med byggstatus, fakturastatus,
kundeinfo og materialbehov. Bor på **ordre.roverk.no** (Vercel).

**Alle i selskapet** logger inn med jobb-e-post + engangskode (PIN). Kun
e-poster på allowlisten slipper inn.

## Hvordan det henger sammen

```
roverk.no (nettsiden)  ──skriver──>  Neon Postgres (orders-tabellen)
                                          ▲
ordre.roverk.no (denne appen) ──leser/oppdaterer──┘
Supabase  = kun innlogging (e-post-OTP)
```

- Nettsiden (`roverk as/03-Nettsider`) skriver nye ordrer til `orders` i Neon.
- Denne appen leser samme tabell og legger til egne kolonner
  (`build_status`, `invoiced_at`, `paid_at`, `is_test`, `planned_build_date`,
  `internal_notes`) – nettsidens kolonner røres aldri.
- Supabase brukes **kun** til autentisering. All data ligger i Neon.

## Oppsett (engangsjobb)

1. **Supabase-prosjekt** (gratis tier holder):
   - Opprett prosjekt på supabase.com → Project Settings → API
   - Kopier `URL` og `anon public key` inn i `.env.local` (se `.env.example`)
   - Auth → Email: skru på e-postinnlogging. OTP-koden sendes automatisk;
     e-postmalen kan oversettes til norsk under Auth → Email Templates
     (bruk `{{ .Token }}` i malen, ikke magic link)
2. **Neon**: kopier `DATABASE_URL` fra nettsidens Vercel-prosjekt inn i `.env.local`
3. **Migrer databasen** (idempotent, trygg å kjøre flere ganger):
   ```bash
   npm run db:migrate
   ```
4. **Legg til ansatte på allowlisten**:
   ```bash
   node --env-file=.env.local scripts/add-email.mjs ola@snekker.no
   ```
5. **Vercel**: nytt prosjekt av dette repoet, sett de tre env-variablene,
   legg til domenet `ordre.roverk.no`.

## Utvikling

```bash
npm install
npm run dev        # dev-server på localhost:3000
npm test           # vitest (domenelogikk)
npm run build      # produksjonsbygg
```

## Mobil

Mobil er primærflaten for snekkerne, så lista rendres som kort under 768 px
(tabell på skrivebord). Status endres via bunnark med fire store valg,
fakturert/betalt er avhukinger på kortet, og fanene «Å bygge» / «Å fakturere»
erstatter filterpanelet for de vanlige tilfellene. Detaljsiden har Ring- og
Veibeskrivelse-knapper. Alle trykkflater er minst 46 px.

## Manuelle ordrer

Bestillinger som kommer via e-post, Instagram eller telefon legges inn med
«+ Ny ordre» på hovedsiden. Kun produkt og kundenavn er påkrevd. Kanal og
hvem som registrerte ordren lagres i `config`. Byggstatus og fakturert/betalt
kan endres direkte fra ordrelista.

## Statusmodell

- **Byggstatus** (fri veksling): Ny → Under bygging → Bygd → Montert
- **Økonomi** (uavhengige avhukinger): Fakturert, Betalt – lagres som tidsstempel
- **Testordre**: flagg som skjuler ordren fra lister og KPI-tall

## Materialbehov

Statiske lister per produkt i `src/data/materials.ts`, transkribert fra
plukklistene i `roverk as/01-Produkter/*/Kalkyler/`:

- **Skjul**: per skur, fra plukkliste «4-dunk Standard» (2026-07-21)
- **Ved**: per enhet for Medium og Stor (kappeliste 2026-07-21); varianten
  gjenkjennes fra ordre-config, ellers vises ingen liste
- **Orden**: ingen plukkliste ennå → viser «materialliste mangler»

> ⚠️ Listene må valideres mot kalkylene før de brukes til bestilling.
> Prinsipp: heller ingen liste enn feil liste.

## Struktur

```
db/migrations/     idempotente SQL-migreringer mot Neon
scripts/           migrate.mjs, add-email.mjs (allowlist)
src/lib/           domenelogikk (status, kpi, format) + db.ts, auth.ts, supabase.ts
src/data/          materials.ts – statisk materialbehov
src/components/    UI-komponenter (tabell, badges, skjemaer)
src/app/           / (liste), /ordre/[id] (detalj), /login
docs/superpowers/  design-spec og implementasjonsplan
```

Se `AGENTS.md` for kontekst rettet mot AI-agenter/utviklere.
