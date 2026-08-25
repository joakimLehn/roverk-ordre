# migrations-ledger-and-ci

## Decision

Migreringer føres i `schema_migrations` (filnavn + sha256) og kjøres av en GitHub Action når de lander på `main`. `scripts/migrate.mjs` printer alltid endepunktet det snakker med, avbryter hvis basen mangler nettsidens `orders`, og avbryter hvis `DATABASE_URL` i miljøet peker et annet sted enn `.env.local`.

## Rejected

- **Migrering i Vercel-bygget.** Preview-deployer bygger mot samme delte base, så hver PR ville migrert prod.
- **Ledger uten vakt.** Automatikk mot en delt base uten å vite hvilken base er verre enn dagens manuelle steg.
- **Kjøre alle filer hver gang (som før).** Fungerte fordi filene er idempotente, men `002` dropper `not null` på nettsidens `orders` ved hver kjøring, og kravet om idempotens ble den eneste bremsen mot en uheldig migrering.
- **Ordentlig migreringsverktøy (Drizzle, node-pg-migrate).** Ny avhengighet for tre filer SQL; `AGENTS.md` forbyr det uten god grunn.

## Reason

Befaring-tabellene ble merget til `main` i #22 og manglet i prod i to timer uten at noe sa fra – `/befaringer` svarte 500 på `select ... from inspections`. Feilsøkingen tok fire runder fordi `DATABASE_URL` lå eksportert i utviklerens shell og pekte på en annen Neon-base: `node --env-file` overskriver ikke variabler som alt finnes i miljøet, så `.env.local` ble stille ignorert og Postgres svarte ærlig at `orders` ikke fantes. Begge feilene er nå umulige å gjøre stille – den ene fordi CI kjører migreringen, den andre fordi skriptet nekter og sier hva du skal gjøre.

## Status

stated

## Evidence

`scripts/migrate.mjs`
`.github/workflows/migrer-database.yml`
`README.md` (avsnittet «Migreringer»)

## Source

`AGENTS.md` (invarianten om idempotente migreringer i `db/migrations/`)
`context/inspections-app-owned.md`

## Revisit when

En migrering trenger `;` inne i en `$$`-kropp (skriptet splitter fortsatt på semikolon), eller basen får flere skrivere enn nettsiden og denne appen, slik at rekkefølge mellom repoene begynner å bety noe.
