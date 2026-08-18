# neon-data-supabase-auth

## Decision

Orders stay in the website’s Neon Postgres; Supabase is email-OTP auth only

## Rejected

migrating orders into a separate database; storing business data in Supabase

## Reason

Same database the website already writes `orders`/`leads` to; the dashboard reads/updates there with no data migration. Supabase is passwordless OTP; 2FA is out of v1.

## Status

stated

## Evidence

docs/superpowers/specs/2026-08-16-roverk-ordre-design.md:15

## Source

docs/superpowers/specs/2026-08-16-roverk-ordre-design.md:15

## Revisit when

2FA is listed as later in docs/superpowers/specs/2026-08-16-roverk-ordre-design.md:142
