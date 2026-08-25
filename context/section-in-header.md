# section-in-header

## Decision

Seksjonsbytte (Ordrer | Befaringer) bor i `Header`. Hver seksjon har sin
egen `BottomNav` for visninger. Ordre-bunnlinja forblir Å bygge / Å
fakturere / Alle.

## Rejected

En fjerde fane i ordre-`BottomNav`. Å bytte bunnlinja til Ordrer |
Befaringer og flytte visningene opp som chips.

## Reason

Seksjon byttes sjelden, før turen. Visning byttes ofte, med hansker, i
tommelsonen. Befaring er et annet objekt enn «Å fakturere»; å blande dem
klemmer tommelfeltet og ødelegger visningstallene.

## Status

stated

## Evidence

`src/components/Header.tsx`, `src/components/BottomNav.tsx`,
`src/components/InspectionBottomNav.tsx`, `src/lib/section.ts`

## Source

`context/befaringer.md` (beslutning 2), GitHub #13

## Revisit when

Befaring blir like hyppig som «Å bygge» og trenger fast plass i
tommelsonen på ordresiden.
