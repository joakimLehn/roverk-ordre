# neon-no-orm

## Decision

Use `@neondatabase/serverless` with parameterized SQL and a typed column whitelist; no ORM

## Rejected

an ORM

## Reason

Same client as the website; keep queries in a small `src/lib/db.ts`. Column names in `updateOrderFields` come only from the typed whitelist — never user input.

## Status

stated

## Evidence

docs/superpowers/specs/2026-08-16-roverk-ordre-design.md:47

## Source

docs/superpowers/specs/2026-08-16-roverk-ordre-design.md:47

## Revisit when

unknown
