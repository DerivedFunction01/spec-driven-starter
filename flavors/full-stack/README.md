# Flavor: full-stack

The core *is* the full-stack shape: a layered backend and a
frontend that meet only at `API.md`. Applying this flavor adds
the process wiring, not new code.

## Two tracks, two gates

- Backend track: `spec/backend/` + `docs/fundamentals.md`,
  gate 1B. No backend application code before 1B is ruled.
- Frontend track: `spec/frontend/`, gate 1F. The frontend is
  built against the model `API.md` serves; a value it needs
  that the model lacks is an API amendment (gate 1A), never a
  client-side derivation.
- One seam: contract amendments append a new version section
  to `API.md`; the sealed text of earlier versions is not
  edited.

## Checklist added by the overlay

`docs/full-stack-checklist.md` — the per-release checks: gate
green, contract version matches on both sides, frontend served
from the backend (or published by the deploy contract), honest
empty states present, no control rendered without a served
behavior behind it (see `docs/mockup-approval.md`).

## Frontend gate battery (when a project grows a build)

The starter's frontend is framework-free and buildless, so the
Python gate is its only gate. When a project adds a frontend
build, it adds its own gate beside `check.py` covering:

- [ ] Generated-artifact freshness: every generated file
      (types, tokens, fixtures) regenerates byte-identically —
      each generator runs in a `--check` mode that fails on drift.
- [ ] Typecheck: the frontend compiles with no errors
      (its compiler's no-emit mode) as a gate leg.
- [ ] Contract tests: the client is tested against the served
      contract, including a byte-equality pin — any client copy
      of a backend-emitted schema or fixture must byte-equal
      the canonical file, so the two sides cannot drift silently.
