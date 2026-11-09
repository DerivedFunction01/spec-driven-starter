# Primitives

The named building blocks every feature in this starter is
composed from. A feature that needs a new primitive adds it here
first, with its contract, before feature code uses it.

## Settings (`backend/foundation/settings.py`)

`Settings.from_env()` returns one frozen object carrying every
machine assumption: host, port, unit name, data path, low-stock
threshold. It is the only environment reader in the repo.

## Store (`backend/infra/store.py`)

Interface: `load_kits() -> list[Kit]`, `save_kits(kits)`.
Implementations: `MemoryStore` (tests, demos) and `JsonFileStore`
(a path from Settings). Services never open files directly.

## Domain rules (`backend/domain/inventory.py`)

Pure functions over plain types: `kit_status(kit, threshold)`
returns a machine enum (`ready`, `low`, `incomplete`) and
`missing_items(kit)` returns the shortfall list. No I/O, no
clock, no globals — the same input always gives the same output.

## Model builder (`backend/services/model.py`)

`build_model(store, settings) -> dict` produces the single
display-ready model `API.md` specifies: every enum arrives with
its human label beside it, every count is computed here. The
frontend never re-derives a status or a label.

## Gate (`check.py`)

Ruff format + lint, the policy-scanner framework, and the
pytest suite, fail-fast. The gate is the definition of "ready
to land"; a red gate is never waived by narration. Full
reference: `docs/checks.md`.

## Supervision kit (`ops/`)

The always-on server's lifecycle, in four parts: the unit
template (`server.service.tmpl`; placeholders for root,
interpreter, home, host, port, and unit name, rendered at
install), `install-unit.sh` (the idempotent render into the
supervisor's unit dir), `serve.sh` (start/stop/restart/status —
delegates to the supervisor when the unit is installed, the
direct pidfile path when it is not), and `watchdog.sh` (the
restore ladder: a twice-bounded health probe; shape
classification — healthy-supervised, unit-absent,
foreign-responder, wedged, down; the repair verb keyed on
load state, start for a freshly installed unit on the long
restore window, restart for a loaded one; the serve path as
fallback; silent on success, nonzero with a note in
`var/state/<unit>.log` on failure — the foreign shape fails
loud by design, never raced). Recovery counts only when the
responder is the unit's own process. Values resolve from the
settings seam via `backend/apps/ops_values.py`. An external
keeper polls the watchdog every few minutes; the kit ships
the ladder and that contract, never a host-specific poller
binding. Drills for every shape live in
`tests/test_supervision.py`.

## Plan file (see `docs/plan-template.md`)

Objective, rulings, steps with verify and done-when, structured
open questions, and the closeout move. The plan plus its todo
files are the work record.

## Guard kit

The one path for committing controls. Four parts: a
**confirm-action** step that names the action, the object, and
the consequence before anything commits; an **arm/confirm**
two-step for lockout-class actions, where arming and firing
are separate gestures; **idempotent submit**, so a repeated
submit — double tap, retry, refresh — has exactly one effect;
and **preview-diff** as the standard grouped-save pattern, so
a multi-field save shows what will change before it commits.
Pairing rule: any control that commits a terminal, bulk, or
lockout action routes through this kit; a committing control
outside it is a defect (the misclick audit in `docs/checks.md`
is how they are found).

## Structured telemetry

A service emits three linked signals from day one: **metrics**
(rate, errors, latency, saturation), **structured logs**, and
**traces** — all carrying the same correlation id, all using
standard semantic attribute names, exported through a
vendor-neutral port (OpenTelemetry) so the telemetry backend
is an assembly choice, not an instrumentation rewrite. Logs
are structured events, never free-text dumps; personal data
and credentials never appear in any signal. The health
endpoint distinguishes liveness (the process runs) from
readiness (the service can take work); a probe that conflates
them proves neither.

## Conditional primitives

Each primitive below is part of a project only when its intake
answer is yes; the activation line is part of its contract.

### Sync lifecycle

*Active when the intake answers yes to: syncs state to an
external system of record.* Sync state lives on the record —
`pending`, `synced`, `failed`, plus a retry count — never only
in a log. A failed sync never blocks the core transaction: the
record stands, the sync retries. The external object is found
by its stored id first, then by search-before-create;
convergence is idempotent and a blind insert is prohibited,
so a retry can never duplicate the external object.

### Specimen seed

*Active when the intake answers yes to: offers a demo or
specimen sign-in mode.* Published fictional sign-ins and a
seeded demo assembly let a reader exercise the whole product
without real data. The demo assembly is separate from the
production assembly, and production fails closed at boot:
specimens off, test fakes refused, a specimen credential in a
production assembly a startup error.

### Brand-link dirty guard

*Active when the intake answers yes to: ships a UI shell with
editable views.* Editable views register their unsaved state
in a tiny dirty registry; the chrome's home (brand) link
consults it — pristine navigates, dirty confirms first. The
guard covers both shells (public and staff), and the link's
accessible name names the destination it guards.

### Media store port

*Active when the intake answers yes to: ships imagery or
accepts user media.* User media splits in two: metadata is
permanent and lives in the database; payloads live behind a
store port, so the storage backend is an assembly choice.
Transfers are chunked, never base64; originals are never
recompressed; renditions are generated on ingest. Every asset
carries a retention class, and expiry is a report-first sweep:
the sweep reports what would expire before anything is
deleted. Assets are manifest-referenced (imagery discipline,
`docs/fundamentals.md`).

### Form specification

*Active when the intake answers yes to: takes form
submissions.* Every form is spec'd field by field before
build: each field names the purpose that needs it; a field is
required only when that purpose fails without it; one question
per field, in neutral wording; the choice type follows the
answer shape (single choice for exclusive answers, multiple
for independent ones, free text when a list would miss
answers). Related fields group; non-applicable fields are
skipped by branching; easy fields precede sensitive ones. The
respondent path — introduction, questions, completion — is
tested with representative *and* incomplete submissions
before the form ships. The guard kit (above) governs the
submit; this primitive governs what is asked.

### Time-and-booking

*Active when the intake answers yes to: books appointments or
slots.* A booking is stored in its own timezone, never
converted to the operator's; a daylight-saving change between
the booking date and the service date is checked at write
time, not discovered on the day. A listed or held slot is not
a confirmed booking — hold, confirmed, and cancelled are
distinct states. Duration, buffer, and travel time are spec'd
values on the service, not UI afterthoughts. After a write,
the record is read back, and its final local time, timezone,
and parties are what gets reported.

### Price-and-terms quote

*Active when the intake answers yes to: quotes prices.* The
backend serves a quote as a total with its components (base,
travel and fees, discounts) and the terms that change its
meaning (refundable, prepaid, pay-on-service, minimum). A
headline or starting price is never the served price. Two
quotes at the same total under different terms are different
offers and are presented as such.

### Orthogonal state axes

*Active when the intake answers yes to: records carry more
than one lifecycle.* The domain spec enumerates a record's
state axes separately — booking, payment, assignment,
fulfilment — each with its own states, transitions, and
actions; no single status field collapses them. A change sets
an explicit target state, never a toggle. An accepted or
queued request is not a confirmed state. After an uncertain
result, the record is read before any retry.

### Expand–contract migrations

*Active when a store's persistence class is local-durable or
shared-production.* A breaking schema change never lands in one
deploy: **expand** (add the new shape; old code unaffected),
**dual-write and backfill** in batches, **flip reads**, then
**contract** (remove the old shape) in a separate later deploy
once nothing references it. Every intermediate state runs both
the old and the new code, so every step is independently
rollback-safe. A dropped column is the irreversible step and
is gated accordingly. Migrations run as their own deploy step,
timed first against production-sized data.
The policy around the pattern: migrations are versioned and
ordered from the first persistent write — a store with no
version marker is pre-versioning debt, named as such.
Introducing a database into a project that had none is
migration zero, planned and rehearsed as a migration, not
absorbed as setup. Every migration is rehearsed against a
production-shaped copy of the data before it runs on
production, and a step that cannot reverse is gated on a
verified backup. The project's release rule states its
deploy/migrate order explicitly.
