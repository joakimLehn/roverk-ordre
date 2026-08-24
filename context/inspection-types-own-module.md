# inspection-types-own-module

## Decision

Inspection-typer og parse/visning ligger i `src/lib/inspection.ts`, ikke i `src/lib/types.ts`. Datobøtter speiles i `src/lib/inspection-groups.ts` ved å kalle `buildGroupOf`/`osloDate`, uten å gjøre `groupByBuildDate` generisk.

## Rejected

- Legge `Inspection` ved siden av `Order` i `types.ts`. Da blandes et objekt denne appen eier med nettsidens ordrekontrakt, og neste leser tror fort at befaring er en ordrevariant.
- Gjøre `groupByBuildDate` om til union av `Order | Inspection`. Issue #11 forbyr det; ordretestene skal stå urørt, og «Uten byggedato» er feil etikett for befaring.
- Duplisere ukesregningen. Da driver `endOfWeek` (mandag–søndag, Oslo-dag) i to filer.

## Reason

`types.ts` er ordrekontrakten mot den delte basen. Befaring er en egen tabell denne appen eier (`context/befaringer.md`). Kalenderbøttene er de samme strengene (`YYYY-MM-DD`); `buildGroupOf` tar ikke `Order`. Sortering innen gruppe er annerledes (klokke, `null` sist) og hører hjemme i speilfunksjonen.

## Status

stated

## Evidence

src/lib/inspection.ts
src/lib/inspection-groups.ts
tests/inspection.test.ts
tests/inspection-groups.test.ts

## Source

https://github.com/joakimLehn/roverk-ordre/issues/11
context/befaringer.md

## Revisit when

db-laget trenger en felles rad-type-fil, eller ukesbøttene for ordre og befaring skal divergere.
