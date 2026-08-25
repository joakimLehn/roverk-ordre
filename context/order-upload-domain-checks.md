# order-upload-domain-checks

## Decision

Token-ruten og `saveOrderFile` kaller `authorizeOrderUpload` / `validateOrderFileInsert` i `src/lib/order-file.ts`. `GET /ordre/[id]/filer/[fileId]` bruker `canServeOrderFile`. Selve I/O (`requireUser`, `getOrder`, Blob) blir i rute og action.

## Rejected

- **Inlinet som `saveInspectionFile` uten hjelpere.** Da kan vi ikke teste «mangler ordre → ingen token» uten å mocke Next, auth og Blob, og token-ruten og insert kan drive fra hverandre.
- **Gjenbruk av `POST /api/befaringer/upload`.** Tokenet skal være bundet til én ordre; feil prefiks er en autorisasjonsfeil (`context/bilder-p-en-ordre.md` beslutning 2).

## Reason

Issue #34 krever suksess- og feilsti i tester. Auth/DB/Blob er utenfor vitest; domenesjekkene er det som avgjør om token eller rad opprettes. Befaringsruten er urørt.

## Status

stated

## Evidence

`src/lib/order-file.ts` (`authorizeOrderUpload`, `validateOrderFileInsert`, `canServeOrderFile`)
`src/app/api/ordre/upload/route.ts`
`src/app/ordre/[id]/actions.ts` (`saveOrderFile`, `removeOrderFile`)
`tests/order-file.test.ts`

## Source

https://github.com/joakimLehn/roverk-ordre/issues/34
`context/bilder-p-en-ordre.md` (beslutning 2)

## Revisit when

En felles `authorizeUpload` for befaring og ordre blir billigere enn to tynne funksjoner.
