## Tittel
feat: redigerbar bestilling – domenelogikk og datalag

## Avhenger av
Ingenting – første oppgave i kjeden.

## Kontekst
Les epic-en (forelder-issuen) og `AGENTS.md` først. Denne oppgaven bygger
den rene domenelogikken og datalaget for å endre en ordres bestilling
(`config` + `product` + evt. `price_nok`) i etterkant. Issue #2 bygger
UI-et oppå dette.

Beslutningene i epic-en er tatt – ikke gjenåpne dem. Kort: alle ordrer kan
redigeres, `site` er låst, config-skjemaet skal være identisk med det
`buildProduct` i `src/lib/manual-order.ts` produserer, app-eide nøkler
bevares, og `redigert_av`/`redigert_kl` settes ved lagring.

## Problem
`updateOrderFields` i `src/lib/db.ts` har en typed whitelist som med vilje
ikke inneholder `config`/`product` – og det finnes ingen valideringslogikk
for å endre en eksisterende bestilling. `buildProduct` er i dag en privat
funksjon i `src/lib/manual-order.ts` som bare brukes ved nyregistrering.

## Løsning

**`src/lib/edit-order.ts`** – ny fil, ren domenelogikk (ingen IO):

```ts
export interface BestillingEdit {
  config: Record<string, unknown>;
  product: string;
  price_nok: number | null;
}

export type EditResult =
  | { ok: true; data: BestillingEdit }
  | { ok: false; error: string };

/** Validerer skjemafelter og bygger ny config for en eksisterende ordre.
 *  site kommer fra ordren, aldri fra skjemaet. */
export function parseBestillingEdit(
  order: { site: string; config: Record<string, unknown>; price_nok: number | null },
  f: Record<string, string>,
  redigertAv: string,
  naaIso: string,
): EditResult
```

Krav til `parseBestillingEdit`:

- Gjenbruk feltvalideringen fra `parseManualOrder`: eksporter `buildProduct`
  fra `src/lib/manual-order.ts` (og prisparsingen om det er ryddigst å
  trekke den ut) i stedet for å duplisere reglene. Skjemafeltnavnene er de
  samme som i `NewOrderForm` (`skjul_count`, `skjul_serie`,
  `skjul_kledning`, `skjul_montering`, `skjul_forankring`, `ved_modell`,
  `orden_bt`, `orden_w`, `orden_h`, `orden_hjul`, `price_nok`, `kanal`).
- Ny config = produktnøklene fra `buildProduct` + app-eide nøkler bevart
  fra eksisterende config (`manuell`, `kanal`, `registrert_av`) +
  `redigert_av: redigertAv` og `redigert_kl: naaIso`.
- `kanal` i skjemaet skal kun tas inn når eksisterende config har
  `manuell: true`, og bare gyldige verdier fra `KANALER`; ellers ignoreres
  feltet.
- `product` settes til `productText` fra `buildProduct`.
- Tomt prisfelt betyr `null` (samme tolkning som ved nyregistrering);
  ugyldig pris gir feil, ikke stille ignorering.
- Ukjent/ustøttet `site` gir `{ ok: false }` – aldri kast.

**`src/lib/db.ts`** – ny funksjon (utvid IKKE `EditableField`-whitelisten
med config; jsonb trenger egen cast, og whitelisten skal forbli
tekstkolonner):

```ts
export async function updateOrderBestilling(
  id: string,
  b: { config: Record<string, unknown>; product: string; price_nok: number | null },
): Promise<void>
```

Én `update orders set config = $2::jsonb, product = $3, price_nok = $4
where id = $1`.

**`src/app/ordre/[id]/actions.ts`** – ny server action `saveBestilling`
etter samme mønster som `saveCustomer`/`saveNotes`: `requireUser()` (bruk
e-posten derfra som `redigertAv`), hent ordren med `getOrder`, kall
`parseBestillingEdit`, ved `ok` kall `updateOrderBestilling` + `done(id)`,
ellers returnér feilmeldingen slik skjemaet kan vise den (samme
feilhåndteringsform som `NewOrderForm`/`parseManualOrder` bruker i dag).

## TDD
Domenelogikken skal testdrives: `tests/edit-order.test.ts` skrives før
implementasjonen. Dekk minst:

- skjul: endret kledning gir ny config med samme nøkkelsett som
  `buildProduct`, bevarte `manuell`/`kanal`/`registrert_av`, og
  `redigert_av`/`redigert_kl` satt
- ved og orden: gyldige og ugyldige felt (orden w/h utenfor 1–5/3–7)
- kanal ignoreres på nettsideordre (config uten `manuell`), tas inn på
  manuell ordre
- prisparsing: tomt felt → null, `«12 500»` → 12500, negativt → feil
- ukjent site → `{ ok: false }`

## Akseptkriterier
- `npx tsc --noEmit && npm test && npm run build` er grønt
- `parseManualOrder`-oppførselen er uendret (eksisterende tester urørte og
  grønne)
- Ingen endring i UI ennå – kun lib/db/action
