# Ny-skjemaet lander parse og insert

## Decision

`/befaringer/ny` eier `parseInspection`, `insertInspection` og migrering `003-inspections.sql` i samme endring som skjemaet. `createInspection` kaller dem; den skriver aldri til `orders`.

## Rejected

Å vente på at domenemodell- og datalag-sakene (#11, #12) merges først: `createInspection` kan da ikke kompilere eller persistere, og akseptansen («rad i inspections») blir umulig å innfri på `feature/10-befaringer`. Å stubbe parse/insert, eller å legge befaringen inn i `orders` med et flagg.

## Reason

Basen har bare specen. Skjemaet speiler `/ordre/ny`, der parse og insert ligger i samme flyt som UI-et. Ukjent produkt/kanal avvises her (ikke gjettes til «annet»), fordi det er kontrakten create-actionen faktisk kjører.

## Status

stated

## Evidence

`src/lib/inspection.ts` (`parseInspection`), `insertInspection` i `src/lib/db.ts`, `src/app/befaringer/ny/actions.ts`

## Source

https://github.com/joakimLehn/roverk-ordre/issues/14

## Revisit when

#11 og #12 er merget og eier parse/tabell/insert; da skal denne PRen bare være UI + action mot de funksjonene.
