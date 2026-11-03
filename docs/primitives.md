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
restore ladder: probe health, reinstall a missing unit,
restart under supervision, fall back to the serve path; silent
on success, nonzero with a note in `var/state/<unit>.log` on
failure). Values resolve from the settings seam via
`backend/apps/ops_values.py`. An external keeper polls the
watchdog; the kit ships the ladder and that contract, never a
host-specific poller binding.

## Plan file (see `docs/plan-template.md`)

Objective, rulings, steps with verify and done-when, structured
open questions, and the closeout move. The plan plus its todo
files are the work record.
