# Liste-status er brikke + sheet, ikke statisk merke

## Decision

På `/befaringer` er statuskontrollen `InspectionStatusChip` + `InspectionStatusSheet`. Kortkroppen (navn, adresse, når, vedlegg) er `Link` til detalj; brikken ligger utenfor lenken. Tabellraden navigerer ved klikk, men status-`<td>` kaller `stopPropagation`.

## Rejected

Hele kortet som én `<Link>` med statisk `InspectionStatusBadge`, og samme merke i tabellen uten `stopPropagation`. Det tvinger statusendring gjennom detaljsiden og fjerner toast+Angre fra lista.

## Reason

Feltendring av status skjer fra Kommende, stående, med hansker. AGENTS.md krever at listeskriving går gjennom `useOptimisticField` med synlig bekreftelse og Angre. En statisk brikke inne i detaljlenken gjør nabotreff til navigasjon i stedet for statusvalg – det var regressjonen da lista ble skrevet om etter at sheet allerede fantes.

## Status

stated

## Evidence

`src/components/InspectionCard.tsx`, `src/components/InspectionTable.tsx`, `src/components/InspectionStatusChip.tsx`

## Source

`context/befaringer.md` (beslutning 7), GitHub #24, `AGENTS.md` (liste-skriving)

## Revisit when

Noen vil ha status kun på detalj, eller et annet listekontroll enn sheet.
