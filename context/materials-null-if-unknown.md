# materials-null-if-unknown

## Decision

Material lists are static picklist lookups; return null rather than a guessed list (Skjul only for 4-dunk Standard)

## Rejected

inventing or scaling lists for other dunk counts/XL; dynamic config-based calculation in v1

## Reason

Never show a wrong list; content must be validated against the kalkyler after earlier unit-price mistakes. Dynamic calculation from config is v2. Skjul numbers are for 4-dunk Standard B3100 only.

## Status

stated

## Evidence

docs/superpowers/specs/2026-08-16-roverk-ordre-design.md:109

## Source

docs/superpowers/specs/2026-08-16-roverk-ordre-design.md:109

## Revisit when

when picklists exist for other Skjul variants, Ved unknown sizes, or Orden; or when v2 dynamic calculation is taken up
