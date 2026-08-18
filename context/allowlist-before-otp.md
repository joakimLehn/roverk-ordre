# allowlist-before-otp

## Decision

Check `allowed_emails` in Neon before sending OTP; the response is the same whether the email is listed or not

## Rejected

sending OTP to arbitrary emails; revealing allowlist membership

## Reason

If the email is not on the list, send no code and do not leak who has access. Middleware/`requireUser()` re-check the list so a removed employee is out immediately.

## Status

stated

## Evidence

docs/superpowers/specs/2026-08-16-roverk-ordre-design.md:54

## Source

docs/superpowers/specs/2026-08-16-roverk-ordre-design.md:54

## Revisit when

admin UI for the allowlist is out of v1 (docs/superpowers/specs/2026-08-16-roverk-ordre-design.md:21)
