# otp-length-8

## Decision

Login accepts an 8-digit OTP (and 6–8 digits in validation), not the spec’s 6-digit code

## Rejected

the v1 spec’s 6-digit-only OTP (docs/superpowers/specs/2026-08-16-roverk-ordre-design.md:18)

## Reason

The Supabase project is configured for 8-digit OTP; validation allows 6–8 so a later length change in Supabase does not lock people out (src/app/login/actions.ts:36).

## Status

reconstructed

## Evidence

5141a5ac26b0688b635103871d453f2d065e4262

## Source

unknown

## Revisit when

if the Supabase OTP length is changed again
