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
