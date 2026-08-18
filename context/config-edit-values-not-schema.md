# config-edit-values-not-schema

## Decision

Existing orders may have `config` values edited in place; keys/format must match the website configurators; `site` cannot change

## Rejected

changing `site` in place; changing config key schema; putting `config` on the text-column `EditableField` whitelist (jsonb needs its own cast)

## Reason

Material list and product text derive from `config`, so a later cladding/dunk/mounting change must be correctable. Semantics stay the website’s: values change, schema does not. Wrong product is a new manual order plus marking the old one as test. Price is editable in the same form so KPIs stay consistent. Channel is editable only on manual orders. `redigert_av`/`redigert_kl` are set; existing `manuell`/`kanal`/`registrert_av` are preserved. `orden-v2` is read as the orden schema and never written back as a new `site`.

## Status

stated

## Evidence

#1

## Source

#1

## Revisit when

unknown
