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

## The directory is the index

`context/` indexes decisions whose long form lives elsewhere. Design docs stay
where they are; `Source` links to them. Duplicating prose between an entry and
its source is how both go stale.

Copy `_template.md` when adding an entry, and name the file after the topic —
the filename is how the next reader finds it. Do **not** maintain a list of
entries in this file. A committed list is a single line every parallel branch
appends to, and base sync merges main into a feature branch through GitHub's
server-side merge endpoint, which cannot union it. Derive the index instead:

```sh
grep -A2 '^## Decision' context/*.md
```
