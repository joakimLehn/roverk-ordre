# Kundeskjema persistenter bare kundekolonner

## Decision

`saveInspectionCustomer` kjører `parseInspection` for validering, men kaller `updateInspectionFields` bare med name, phone, email, address, product og channel.

## Rejected

Spre hele `parseInspection`-objektet inn i update. Parseren default'er `status` til `aktiv` og `scheduled_*` til null når feltene ikke er i skjemaet, så en kundelagring ville nullstilt avtale og satt status tilbake til aktiv.

## Reason

`parseInspection` er parseren for hele befaringen. Kundeskjemaet sender ikke avtale, status eller notat. Å persistere parserens defaults ville vært en stille overwrite – stikk i strid med last-write-wins på feltene brukeren ikke rørte.

## Status

stated

## Evidence

`src/app/befaringer/[id]/actions.ts` (`saveInspectionCustomer`)

## Source

https://github.com/joakimLehn/roverk-ordre/issues/15

## Revisit when

`parseInspection` får en modus for delvis oppdatering, eller kundeskjemaet sender med de øvrige feltene som hidden.
