# order-files-app-owned

## Decision

Appen eier tabellen `order_files` (full CRUD). Ingen nye kolonner på `orders`. Ingen skriving til `config`. FK mot `orders.id` med `on delete cascade` er tillatt.

## Rejected

Gjenbruk av `inspection_files` med nullable `order_id` (blander to produkter og e-postfelter). Jsonb på ordre-raden (tabell vi ikke eier). Supabase Storage (auth-only).

## Reason

Samme eierskapsmønster som `allowed_emails` og `inspection_files`: det vi oppretter, eier vi. Ordrevedlegg er reklamasjonsbevis og skal kunne leve uavhengig av befaringsseksjonen.

## Status

stated

## Evidence

`db/migrations/004-order-files.sql`, `src/lib/db.ts` (`listOrderFiles`, `insertOrderFile`)

## Source

`context/bilder-p-en-ordre.md` beslutning 1, GitHub #30 / #33

## Revisit when

Nettsiden begynner å skrive ordrevedlegg, eller noen slår sammen befaring og ordre til ett saksobjekt.
