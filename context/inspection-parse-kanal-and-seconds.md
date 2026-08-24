# parseInspection godtar kanal og HH:MM:SS

## Decision

`parseInspection` leser skjemafeltet `kanal` (samme navn som manuell ordre) i tillegg til `channel`, og normaliserer HTML-tid `HH:MM:SS` til `HH:MM`. Ny-skjemaet på `/befaringer/ny` bruker basens `inspection.ts`, `db.ts` og `003-inspections.sql`.

## Rejected

Å gi skjemaet `name="channel"` (bryter speilingen av `NewOrderForm` sin `kanal`-select). Å avvise sekunder (nettleserens `type="time"` kan sende dem). Å beholde en egen parse/insert/migrering i ny-skjema-PRen etter at domenelaget er merget.

## Reason

Skjemaet speiler manuell ordre, der feltet heter `kanal`. Kolonnen og domenet heter `channel`. Uten begge nøkler blir kanal always-null fra UI. Tid lagres som `HH:MM` i specen; å kutte sekundene bevarer den kontrakten uten å feile på lovlig HTML.

## Status

stated

## Evidence

`parseInspection` i `src/lib/inspection.ts`; `src/app/befaringer/ny/NewInspectionForm.tsx` (`name="kanal"`, `type="time"`)

## Source

Merge of #14 into `feature/10-befaringer` after #11/#18.

## Revisit when

Skjemaet bytter til `name="channel"`, eller `scheduled_time` skal beholde sekunder.
