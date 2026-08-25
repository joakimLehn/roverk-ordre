# ordrevedlegg-ui-krever-api

## Decision

UI-issuen (#35) tar med migrering, datalag og opplastingsruter (#33/#34) i samme PR, fordi `feature/30-bilder-p-en-ordre` hadde `upload.ts` og `order-file.ts` (#31/#32) men ikke `order_files`, `saveOrderFile` eller `/api/ordre/upload` da UI-et skulle kompilere.

## Rejected

Å importere `listOrderFiles` / `saveOrderFile` uten å legge inn tabell og ruter – da er `tsc` rødt. Å gjenbruke `InspectionHistory` med et mode-flagg – epic-en avviser det fordi den eier e-postutdrag.

## Reason

`OrderAttachments` kan ikke kalle en action som ikke finnes. Kontrakten er låst i epic-en; denne PR-en fyller #33/#34, den omgjør den ikke. Søsken-PR-er for de issue-ene kan rebase mot de samme filene.

## Status

stated

## Evidence

`src/components/OrderAttachments.tsx`, `src/app/ordre/[id]/actions.ts`, `db/migrations/004-order-files.sql`

## Source

GitHub #35 (avhengighet av «forrige issue»), `context/bilder-p-en-ordre.md` beslutning 6 og 8

## Revisit when

#33 og #34 er merget inn i `feature/30-bilder-p-en-ordre` og denne grenen rebase-es; da kan duplikat fra de issue-ene trekkes ut.
