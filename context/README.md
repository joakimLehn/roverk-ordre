# `context/` — decisions, by topic

`context/` is a topic index over decisions this repository has already taken.
Each entry is short: what was chosen, what was rejected, and where the long
form lives. An agent that has never seen this convention should be able to
find the three entries that bear on its question without reading the design
docs in chronological order.

## Schema

Every entry file uses these headings, one line of meaning each:

- **Decision** — what was chosen.
- **Rejected** — the alternatives, and what was wrong with them.
- **Reason** — written to convince someone who was not in the conversation.
- **Status** — `stated`, `reconstructed`, or `superseded` (pointing at its replacement).
- **Evidence** — a file path, a function name, or a commit a reader can open.
- **Source** — where the long form lives (a design doc, an invariant, a review).
- **Revisit when** — the condition that reopens the decision.

`Status` values:

- `stated` — decided in a spec, a review, or `AGENTS.md`, and implemented.
- `reconstructed` — inferred from history. Weigh as evidence, not as a requirement.
- `superseded` — no longer in force; the body points at the replacement entry.

## Index, not a second copy

`context/` indexes decisions whose long form lives elsewhere. Design docs stay
where they are; `Source` links to them. Duplicating prose between an entry and
its source is how both go stale.

Copy `_template.md` when adding an entry. Add a line to the topic index below
in the same pull request — a drifting index is worse than none.

## Topic index

- `neon-data-supabase-auth.md` — Orders stay in the website’s Neon Postgres; Supabase is email-OTP auth only
- `two-dimension-status.md` — `build_status` (ny/under_bygging/bygd/montert, free navigation) is independent of `invoiced_at`/`paid_at`; `is_test` hides from lists and KPIs
- `materials-null-if-unknown.md` — Material lists are static picklist lookups; return null rather than a guessed list (Skjul only for 4-dunk Standard)
- `allowlist-before-otp.md` — Check `allowed_emails` in Neon before sending OTP; the response is the same whether the email is listed or not
- `neon-no-orm.md` — Use `@neondatabase/serverless` with parameterized SQL and a typed column whitelist; no ORM
- `last-write-wins.md` — Concurrent edits: last write wins
- `config-edit-values-not-schema.md` — Existing orders may have `config` values edited in place; keys/format must match the website configurators; `site` cannot change
- `mobile-first-field-ui.md` — Below `sm`, the order list is cards; frequent status changes use `StatusSheet`, not dropdowns; tap targets ≥ 46px; inputs `text-base` on mobile
- `otp-length-8.md` — Login accepts an 8-digit OTP (and 6–8 digits in validation), not the spec’s 6-digit code
