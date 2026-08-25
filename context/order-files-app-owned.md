# order-files-app-owned

## Decision

Denne appen eier `order_files` i den delte Neon-basen, samme mønster som `inspection_files`: full CRUD, idempotent migrering, ingen nye kolonner på `orders`. FK mot `orders.id` med `on delete cascade` er tillatt; nettsidens kolonner røres ikke.

## Rejected

- **Gjenbruk av `inspection_files`** med nullable `order_id`. Befaring og ordre er ulike objekt; tabellen har `subject`/`body_text` for e-post, og cascade fra `inspections` ville blandet to produkter.
- **Jsonb-kolonne på `orders`** (`attachments`). Ny kolonne på en tabell vi ikke eier; blob-stier hører ikke hjemme i nettsidens rad.
- **Supabase Storage.** Bryter `context/neon-data-supabase-auth.md`.

## Reason

Reklamasjon trenger bilder på ordren, uavhengig av befaringsseksjonen. Tabeller vi selv oppretter er den etablerte måten å eie data på i den delte basen. En fremmednøkkel er en referanse, ikke eierskap over `orders`. `listOrders` får ingen `file_count`-subquery – lista skal ikke bli dyrere av vedlegg.

## Status

stated

## Evidence

`db/migrations/004-order-files.sql`
`src/lib/db.ts` (`listOrderFiles`, `insertOrderFile`)
`src/lib/normalize.ts` (`normalizeOrderFile`)

## Source

https://github.com/joakimLehn/roverk-ordre/issues/30
https://github.com/joakimLehn/roverk-ordre/issues/33
`context/bilder-p-en-ordre.md` (beslutning 1)

## Revisit when

Nettsiden begynner å skrive ordrevedlegg, eller noen slår sammen befaring og ordre til ett saksobjekt.
