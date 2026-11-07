# SPEC — field-kit inventory (index)

This file is the index of the sample specification. It carries
no spec content of its own; it maps the small files under
`spec/`, states the rules for reading and amending them, and
records where everything came from.

## Source

The sample domain was authored as fiction for this starter: a
field-kit inventory service for a small outdoor club, tracking
kits and their readiness. There is no predecessor system; the
"evidence" for each rule is the worked example in the spec
files themselves. A real project replaces this section with its
oracle: the predecessor or source material the spec was
extracted from, and the rule for disagreements (observed
behavior wins over documents, and the extraction says so).
A conversion project declares `Mode: conversion` below and
follows the characterization-first track in
`docs/conversion.md`.

## Layout and gates

Mode: greenfield

- **Backend track** — `spec/backend/` — Python. Gate 1B.
- **Frontend track** — `spec/frontend/` — static client. Gate 1F.
- **`API.md`** (repo root) — the contract (`api/2`; `api/1`
  sealed above its amendment), the only seam between the
  tracks. Gate 1A.

No application code before its track's gate is ruled. For this
sample the gates are recorded as ruled in the file map below so
the skeleton runs; a real project leaves them open until the
owner rules.

## File map

| File | Contents |
| --- | --- |
| `spec/backend/00-product-summary.md` | product summary (both tracks cite it) |
| `spec/backend/01-features.md` | backend features: model build, readiness, store |
| `spec/backend/02-domain.md` | domain rules: kit completeness, status derivation |
| `spec/frontend/01-features.md` | frontend features: kit list, kit detail, empty states |
| `spec/route-coverage.md` | route enrollment registry (the route-coverage check) |

## Provenance

Authored for this starter as a fictional worked example.
Section numbering is stable from first publication.

## Amending

Amend the small file that owns the section; keep numbering
stable; date the amendment and cite its ruling or evidence.
A behavior change amends the spec in the same change that
implements it. A contract change amends `API.md` under its own
versioning rules. Material outgrowing a file (~800 lines) gets
its own file and a map row.
