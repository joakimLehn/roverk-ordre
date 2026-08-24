# vercel-blob-inspection-files

## Decision

Befaringsbilder og PDF-er ligger i **privat Vercel Blob**. Indeks, metadata og innlimte e-postutdrag ligger i Neon `inspection_files`. Bytene går klient → Blob via `handleUpload`; den autentiserte fil-ruten redirecter til en signert URL (~60 min).

## Rejected

- **Supabase Storage** — `AGENTS.md` og `context/neon-data-supabase-auth.md`: Supabase er kun auth. Kundebilder fra hjemmet er forretningsdata.
- **`bytea` i Postgres** — Neon er ikke objektlager; 15 MB PDF-er hører ikke hjemme i raden.
- **Opplasting gjennom Server Action** — Vercel serverless har ~4,5 MB request-body; telefonbilder er ofte større.
- **Offentlige Blob-URL-er i HTML** — vedlegg er private; `<img src>` og PDF-lenker går via `/befaringer/[id]/filer/[fileId]`.
- **Ny PDF-/bilde-viewer** — nettleseren viser PDF; `<img>` viser vanlige bilder. Ingen `next/image` mot private URL-er.

## Reason

Blob er det som passer et Vercel-prosjekt uten å bryte auth-grensen. Ny avhengighet `@vercel/blob` er den eneste grunnen til å utvide pakkelisten: vi kan ikke sende 15 MB gjennom en Server Action, og vi kan ikke legge kundebilder i Supabase.

## Status

stated

## Evidence

`src/app/api/befaringer/upload/route.ts`, `src/app/befaringer/[id]/filer/[fileId]/route.ts`, `package.json` (`@vercel/blob`)

## Source

`context/befaringer.md` (beslutning 4), GitHub #10 / #16

## Revisit when

De allerede har et annet privat bucket, eller Blob-kost/kvote blir et problem.
