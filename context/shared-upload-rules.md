# shared-upload-rules

## Decision

MIME, størrelse, antall, `kindFromContentType`, `isRenderableImage` og `deleteBlobThenRecord` bor i `src/lib/upload.ts`. Befaring re-eksporterer konstantene som `INSPECTION_*`-alias og wrapper `validateInspectionFileCount` mot `'befaring'`. `deleteInspectionBlobsThenRecord` blir i `inspection-file.ts`.

## Rejected

- Kopiere MIME-listen inn i en ordremodul. To kilder til «hva er lov» driver.
- Flytte e-postutdrag (`kind=epost`) inn i `upload.ts`. Det er befaringsspesifikt.
- Slette `INSPECTION_*`-aliasene i samme steg. Kallere og inspection-tester skal stå urørt til ordre-UI lander.
- Oppdatere `AGENTS.md`/`README.md` nå. Blob er fortsatt bare befaring utad inntil `order_files` finnes.

## Reason

Ordrevedlegg skal ha identiske regler som befaring (#30 beslutning 4 og 8). Wrappers holder eksisterende `/befaringer`-oppførsel og tester grønne mens felleskilden er klar for neste issue.

## Status

stated

## Evidence

src/lib/upload.ts
src/lib/inspection.ts (`INSPECTION_ALLOWED_MIME`, `validateInspectionFileCount`)
src/lib/inspection-file.ts (`isRenderableImage`, `deleteBlobThenRecord`)
tests/upload.test.ts

## Source

https://github.com/joakimLehn/roverk-ordre/issues/31
context/bilder-p-en-ordre.md (beslutning 8)

## Revisit when

En tredje opplaster trenger egne grenser, eller `INSPECTION_*`-aliasene kan fjernes når alle kallere peker på `upload.ts`.
