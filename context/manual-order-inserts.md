# manual-order-inserts

## Decision

This app may INSERT orders for email/Instagram/phone with `config: { manuell, kanal, registrert_av }`; website orders never have those keys

## Rejected

unknown

## Reason

Orders also arrive via e-post/Instagram/telefon; those rows often lack phone and email, so those columns were made nullable (db/migrations/002-manuelle-ordrer.sql:1).

## Status

stated

## Evidence

4c354ae13a463843adf0a5afd03bda2469675d30

## Source

AGENTS.md:22

## Revisit when

unknown
