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

## Restart-survival contract — v1

`survival-contract: v1`

The canonical pattern every always-on service built from
this starter conforms to, so a host replacement is a
minutes-long self-healing event — never an agent
intervention, never a service silently down because its
copy of the pattern missed a rung another service learned
the hard way. A service claims restart survival when all
of these hold:

1. **Tracked unit template + installer** in the service's
   own repo; the installed unit is a render of it. System
   configuration outside the repo does not survive a host
   replacement; the repo does.
2. **External driver** on the contract's tiered cadence —
   hook-class (~120 s) for services whose absence blocks
   other work, a scheduler entry (~5 min) acceptable
   otherwise — running the watchdog whether or not the
   service is up. A service never supervises itself; a
   component that cannot drive itself names its external
   driver.
3. **Presence before health:** the unit file's presence is
   checked separately from process health;
   healthy-but-unit-gone is a quiet reinstall.
4. **Render-when-invalid:** a present unit that is not
   byte-equal to the current template render is
   re-rendered, not merely started.
5. **Bounded, detached probes:** health probes bound the
   whole read under a cumulative deadline and run behind a
   hard budget, so a wedged process (headers sent, body
   stalled) reads as down and the ladder proceeds — the
   probe can never hang the watchdog.
6. **Load-state repair verb:** not loaded → start; loaded
   → restart. Restarting an unloaded unit is spent motion.
7. **Fresh-restore confirmation window:** a freshly
   installed unit's first start gets a long window (180 s
   in the kit) before the attempt counts as failed — a
   first start may run a startup sweep before the port
   binds.
8. **Poll-verified ladder with an episode cap:** attempts
   verify by polling the health endpoint, never a fixed
   wait; one ladder attempt per episode marker, then
   escalation; a pre-supervisor fallback start is the last
   rung.
9. **Supervision is the verdict:** recovered means the
   health endpoint answers from the supervised unit's own
   process. An answering port alone never counts; a foreign
   process holding the port is a failure shape, never
   raced.
10. **End-state verification beyond the process,** where
    the service has dependencies: recovery revives them
    and verifies the end state, and resident state derives
    from durable records, never agent-held launch state.
11. **Suite coverage** of the supervision logic: the kit's
    drills cover rungs 3–8 by name.

The kit in `ops/` is this contract's reference
implementation; `docs/fundamentals.md` (Supervision)
carries its conformance stamp. A pattern change amends
this section first and bumps the version; conforming repos
re-conform against the delta and restamp. No repo edits
its copy of the pattern unilaterally.

## Provenance

Authored for this starter as a fictional worked example.
Section numbering is stable from first publication.

## Amending

Amend the small file that owns the section; keep numbering
stable; date the amendment and cite its ruling or evidence.
A behavior change amends the spec in the same change that
implements it. A contract change amends `API.md` under its own
versioning rules. Material outgrowing a file (past the gate's
length cap) gets its own file and a map row.
