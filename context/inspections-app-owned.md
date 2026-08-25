# inspections-app-owned

## Decision

Denne appen eier `inspections` og `inspection_files` i den delte Neon-basen, samme mønster som `allowed_emails`: full CRUD, idempotent migrering. `orders` og `leads` røres ikke.

## Rejected

- **Flagg / `build_status` på `orders`.** Befaring er ikke en ordre. Det ville forurenset «Å bygge», KPI-er, materialliste og `config`-semantikk.
- **Gjenbruk av `leads`.** Tabellen eies av nettsiden; vi kjenner ikke skjemaet herfra, og v1-specen forbyr å endre nettsidens semantikk.
- **Ny database.** Bryter `context/neon-data-supabase-auth.md`.

## Reason

Operatoren ba om en seksjon uavhengig av ordrene. Tabeller vi selv oppretter er den etablerte måten å eie data på i den delte basen. UPDATE-kolonner kommer kun fra `INSPECTION_EDITABLE_FIELDS`; `inspectionUpdateKeys` dropper ukjente nøkler så de aldri interpoleres i SQL.

## Status

stated

## Evidence

`db/migrations/003-inspections.sql`
`src/lib/inspection-update.ts`
`src/lib/db.ts` (`listInspections`, `updateInspectionFields`)

## Source

https://github.com/joakimLehn/roverk-ordre/issues/10
https://github.com/joakimLehn/roverk-ordre/issues/12
`context/befaringer.md` (beslutning 1)

## Revisit when

Nettsiden begynner å skrive befaringer, eller noen vil slå sammen leads og befaringer etter å ha lest `leads`-skjemaet i `03-Nettsider`.
