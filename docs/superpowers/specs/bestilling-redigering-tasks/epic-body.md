# Redigerbar bestilling

I dag kan ansatte redigere kundeinfo, status, byggedato og notater på en
ordre – men ikke selve bestillingen. Ble kledning, antall dunker eller
montering avtalt om etter en telefonsamtale med kunden, finnes det ingen
måte å rette det på. Materiallisten og produktteksten blir da feil, siden
begge deriveres fra `config`.

Denne epicen gjør BESTILLING-seksjonen på ordredetaljsiden redigerbar.

## Beslutninger (ta dem ikke om igjen)

1. **Gjelder alle ordrer**, både manuelle og nettside-ordrer. Vi endrer
   *verdiene* i `config`, aldri skjemaet: nøklene og verdiformatet skal være
   identisk med det nettsidens konfiguratorer skriver (samme skjema som
   `buildProduct` i `src/lib/manual-order.ts` produserer). Det bryter ikke
   AGENTS.md-regelen om delt database – semantikken er uendret.
2. **Produkttype (`site`) kan IKKE endres.** Feil produkt håndteres ved å
   registrere en ny manuell ordre og merke den gamle som test.
3. **`product`-teksten regenereres** fra config ved lagring (samme
   `productText` som `buildProduct` lager), så lister og detaljside alltid
   viser det som faktisk skal bygges.
4. **Pris kan justeres i samme skjema** (valgfritt felt, forhåndsutfylt med
   dagens `price_nok`) – endrer man 3-dunk til 4-dunk skal ordrebeløpet
   kunne følge med, ellers blir KPI-ene feil.
5. **Kanal kan bare endres på manuelle ordrer** (nettsideordrer har ingen
   kanal i config).
6. **Sporbarhet**: ved lagring settes app-eide nøkler `redigert_av`
   (e-post fra `requireUser()`) og `redigert_kl` (ISO-tidsstempel) i
   config. App-eide nøkler som allerede finnes (`manuell`, `kanal`,
   `registrert_av`) skal bevares uendret.

## Oppgaver

- [ ] feat: redigerbar bestilling – domenelogikk og datalag
- [ ] feat: redigerbar bestilling – skjema på ordredetaljsiden

## Referanser

- `AGENTS.md` – særlig «Kritisk å forstå: delt database» og «Regler for
  endringer» (TDD for `src/lib/`, norsk UI-tekst, mobilkrav)
- Design-spec: `docs/superpowers/specs/2026-08-16-roverk-ordre-design.md`
- Eksisterende redigeringsmønster: `src/components/CustomerForm.tsx`
  («Rediger kundeinfo»)
