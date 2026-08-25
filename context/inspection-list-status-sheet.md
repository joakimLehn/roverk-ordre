# inspection-list-status-sheet

## Decision

Befaringslista endrer status med `InspectionStatusChip` + `InspectionStatusSheet` utenfor detaljlenka, via `setInspectionStatus` og `useOptimisticField` med toast **Angre**. Detaljsiden beholder `InspectionStatusButtons`. Statisk badge er ikke listestyring.

## Rejected

- **Hele kortet som `<Link>` rundt en `InspectionStatusBadge`.** Da må snekkeren inn på detalj for å merke gjennomført/avlyst, og nabotreff på lista kan ikke angres. Det var `#13` sin overskriving av `#15`.
- **Sheet på detalj i stedet for lista** («Lista åpner ikke sheet – det gjør detaljsiden»). Epic og `AGENTS.md` krever sheet+angre på listeskriving. Detaljknappene er et tillegg, ikke en erstatning.
- **Ny listestyring** i stedet for chip/sheet som allerede fantes.

## Reason

Hansker, stående, én hånd: status på Kommende skal flytte seg med én gang og kunne tas tilbake i fem sekunder, samme løkke som `OrderCard`. To trykkmål (kropp → detalj, brikke → sheet) er det som gjør det mulig. `stopPropagation` på tabellcellen er nødvendig fordi raden selv navigerer.

## Status

stated

## Evidence

`src/components/InspectionCard.tsx`, `src/components/InspectionTable.tsx`, `src/components/InspectionStatusChip.tsx`

## Source

`context/befaringer.md` beslutning 7; GitHub #24

## Revisit when

Lista får et sidepanel, eller statusendring flyttes tilbake til kun detalj etter avtale med de som bruker appen i felt.
