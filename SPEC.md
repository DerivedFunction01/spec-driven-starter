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

## Stack-dump contract — v1

`stackdump-contract: v1`

The canonical instrumentation every always-on server
built from this starter carries, so a wedged process
names its own root cause before any external ladder
restarts it and destroys the evidence. The dump is
diagnostic only: it never restarts, kills, or mutates
anything — recovery stays with the survival contract's
ladders — and it adds no new authority and no new
external surface. A server conforms when all of these
hold:

1. **In-process watchdog thread:** a dedicated daemon
   thread, started with the server, performs an internal
   health check on a fixed cadence (default 5 s): it
   stamps a heartbeat, then verifies the server's own
   health path answers from inside the process — the
   same computation the external health route serves,
   called directly, never an HTTP self-call, which would
   measure the acceptor instead of the handlers.
2. **Lag threshold:** when the internal check has not
   completed within the threshold (default 15 s — three
   missed cadences), the watchdog declares a lag event.
   Cadence and threshold are config in the server's
   existing config seam, with the contract defaults as
   the shipped values.
3. **The dump:** on a lag event the watchdog writes one
   dump to the server's state/log area: a header line
   (UTC timestamp, server name, contract version, lag
   duration, heartbeat age) followed by every live
   Python thread's stack — thread names, frame files,
   line numbers, and function names only, never frame
   locals or request data. The write goes through a
   dedicated file handle opened at startup, in append
   mode, taking no lock shared with request handling:
   the watchdog's own work per cycle is a deadline check
   plus an in-memory frame read and one append, so the
   dump mechanism cannot hang on the wedge it diagnoses.
4. **Repeat and size discipline:** while a lag persists,
   dumps repeat at most once per 60 s; the first dump
   after recovery begins a new event. Dumps are capped
   in aggregate (default: the dump file rotates or
   truncates at 16 MiB), so a long wedge cannot fill the
   disk the recovery ladder needs.
5. **Contract tests:** the server's suite carries (a) a
   test that a handler deliberately parked past the
   threshold produces a dump naming the parked frame,
   with the watchdog thread itself never blocking on the
   parked handler's locks; (b) a test that a healthy
   server produces no dump over several cadences; (c) a
   test that the dump file's size cap holds under
   repeated lag events.
6. **External legibility:** the dump file's location is
   named in the server's supervision doc beside the
   contract stamp, and the server's health payload or
   state file reports the last dump's timestamp — one
   field, no content — so an external watcher can tell
   "wedged and dumped" from "wedged silently" without
   reading the dump.
7. **Version stamp:** the server's supervision or
   architecture doc carries `stackdump-contract: v1`;
   conformance is claimed only when 1–6 hold and the
   suite carries 5.

The sketch in `ops/stackdump.py` is this contract's
reference shape; a conforming server adapts it to its own
config seam and health computation. A contract change
amends this section first and bumps the version;
conforming repos re-conform against the delta and
restamp. No repo edits its copy of the contract
unilaterally.

## File-registry contract — v1

`file-registry: v1`

The canonical pattern for knowing which files must exist
after a host restart, and for putting back the ones that
can be put back. Losses this contract exists to catch
early: state directories wiped with a worktree closeout
and no surviving copy, and truncated files left at zero
bytes by a failed write — both read as merely missing
downstream, far from the event that caused them. A
conforming registry and checker hold all of these:

1. **One manifest format.** A registry is a YAML manifest
   of entries; each entry names a path or glob resolved
   against a declared root anchor, a presence rule, a
   restore class with its source, and the owner who is
   flagged when the entry cannot be made good. The format
   is the contract; the live manifest is untracked data,
   seeded from the tracked specimen in
   `examples/registry/`.
2. **Presence is exact.** The rules are `exists`,
   `non-empty`, and `sha256` (the entry carries the
   expected digest). A missing file fails every rule; a
   zero-byte file fails `non-empty` and `sha256` — a
   truncated file is a failed file, never a present one.
   A glob entry checks every match, and a glob matching
   nothing fails unless the entry is marked optional.
3. **Restore by class, from the declared source only:**
   a tracked file is restored from its repo; a generated
   file by re-running its declared generator; a live
   untracked file from its declared backup. No class
   restores from anywhere else, and no restore invents
   content.
4. **Flag-only is a class, not a failure of imagination.**
   An entry with no restore source is flagged to its
   owner and left alone: the checker never writes a
   plausible substitute for a file it cannot restore.
5. **Restart-triggered, restore-first.** The checker runs
   when restart detection fires (an interval pass and a
   manual pass are the same code path); it restores what
   is restorable automatically, re-checks each restored
   entry against its presence rule, and reports the rest.
   A restore that does not satisfy the rule is a flag,
   not a success.
6. **The report names the exceptions.** One report per
   pass: every entry not ok, with its verdict (restored,
   or flagged with the reason) and the action taken.
   Entries that pass are counted, not listed.
7. **One contract, three workhorses.** The scheduler,
   the workspace harness, and the session venue each run
   a conforming checker over the registries anchored in
   their own domain; a registry written for one parses
   under any conforming checker, and no workhorse extends
   the format unilaterally.
8. **The seed list is a ruling, not a default.** Which
   files are critical enough to register first is a named
   decision in `docs/file-registry.md`, taken when the
   first checker is commissioned; the candidates named
   there are examples, not a list in force.

`docs/file-registry.md` is this contract's full text: the
manifest format field by field, the check contract, and
the seed-list decision. A format change amends this
section first and bumps the version.

## Provenance

Authored for this starter as a fictional worked example.
Section numbering is stable from first publication.

## Amending

Amend the small file that owns the section; keep numbering
stable; date the amendment and cite its ruling or evidence.
A behavior change amends the spec in the same change that
implements it. A contract change amends `API.md` under its own
versioning rules. Material outgrowing a file (past the gate's
length cap) gets its own file and a map row. Documents state
the present: a stable amendment folds into the body it amends
at a consolidation pass, and its dated layer retires to the
change history; a versioned contract's amendment record keeps
its layers.
