# Checks: the gate and the scanners

The gate is `check.py` at the repo root. Green is the definition
of ready to land; a red gate is never waived by narration.

## The gate

```sh
python3 init_venv.py   # once: build var/venv from pyproject.toml
python3 check.py       # the gate
```

Legs, fail-fast, each leg's exit code becoming the gate's:

1. **ruff format --check** — formatting, per `pyproject.toml`.
2. **ruff check** — lint (select E F I W UP B). Suppressions live
   in `pyproject.toml` with a written rationale, never scattered.
3. **Policy scanners** — the framework below; exit 1 when any
   error-severity finding exists.
4. **pytest** — the suite under `tests/`, xdist-parallel.

The gate runs under the repo venv: invoked with any other
interpreter it re-executes itself under `var/venv/bin/python`;
with no venv it prints the `init_venv.py` instruction and
exits 2.

Modes: default runs targeted tests (below); `--all` the full
suite; `--fast` static legs + scanners, no tests; `--scan`
scanners only; `--test` pytest only; `--fix` applies ruff
format + safe lint fixes and exits; `--workers N` sets xdist
workers (default 2); `--explain` prints each targeting
decision; positional paths go straight to pytest while the
static legs still run in full.

Targeted pytest (default): changed Python files (git status,
untracked included) map to their flat mirror tests —
`backend/<...>/y.py` or `tools/y.py` to `tests/test_y.py` when
it exists; changed test files target themselves; a change to
the scanner/checks harness, `check.py`, `init_venv.py`, or
`pyproject.toml` pulls in the whole suite. A clean tree runs
no tests and exits 0; when git cannot answer, the full suite
runs — a small suite is not worth a clever miss.

**Contract-surface scoping.** Targeting by changed file is the
default, never the scope proof. A change to a shared contract —
`API.md` or anything under `spec/` — gates every surface that
consumes it: the gate runs the whole suite and `--explain`
says why ("contract change …: all surfaces"). The gate reports
per leg and per scanner, never one blended green; a surface
deliberately excluded from a run is named, with the check that
cleared it, in the landing record — a red in an excluded
surface that shares the contract is part of the change.

**Test-isolation proof.** When tests run, the gate hashes the
real state files under `var/` (the venv excluded) before and
after the suite. Tests and fakes resolve every home, config,
session, and state path from the harness or a scratch
directory, and clocks, caps, and limits are injected, never
hardcoded — so any difference in the hashes fails the gate
even when every test passes, and the report names the files
that changed.

## Tooling seam

`pyproject.toml` is the single tooling seam: project metadata,
the dependency spec, ruff config, pytest config. Runtime
dependencies are empty (the sample is stdlib-only); the dev
pins are exact — ruff, pytest, pytest-xdist, pytest-timeout —
and `init_venv.py` reads them from the pyproject and installs
them into `var/venv`, nothing system-wide.

## The scanners

Framework: `backend/foundation/scanners/` — one module per
scanner exporting `SCANNER`, shared `Finding`/`Scanner` types
in `base.py`, file discovery in `files.py`, the ordered
registry in `registry.py`, and the runner at
`backend/foundation/checks/runner.py`. Severities: **error**
fails the gate; **notice** prints but never fails (a leg
reporting itself unconfigured).

| Scanner | Rule in one line |
| --- | --- |
| length | no file over the length cap the scanner's constant sets (Python + frontend scripts) |
| portability | tracked text references only what a fresh clone resolves: no absolute or home-anchored paths, no owner's name, no specific untracked plan files |
| denylist | no personal literals from the provisioned denylist (below) |
| layers | backend imports point downward only across foundation < domain < infra < services < apps (AST) |
| no_reexport | no import statements in any `backend/**/__init__.py` |
| settings_seam | no environment access outside `backend/foundation/settings.py` (one named harness exemption: the denylist scanner) |
| literal | no SSN-shaped, credential-shaped, or token-shaped literals in tracked content |
| legacy_shims | no backward-compatibility wording in code or comments, no banned identifier parts, no bare CamelCase alias bindings |
| prose_length | docstring caps (module 4, def/class 3; tests 3/2) and comment-block caps |
| clean_exit | no process exits in the library tiers; entry points and `__main__` guards excepted |
| tracking | no tracked files under `var/` (git ls-files; degrades to a notice without git) |
| tests_tracked_only | test strings reference no `var/` or frozen-snapshot paths |
| route_coverage | every route served by the apps layer is enrolled in `spec/route-coverage.md`; exemptions name an expiry and die on schedule |
| port_boundary | provider names appear in code only under a `vendors/` path segment — provider specifics stay behind the port |
| privacy_pin | no staff-only field (`internal_*`, `staff_*`, pinned names) in a services-layer payload dict |
| asset_manifest | every binary or external asset the frontend uses is registered in `frontend/assets-manifest.json`; stale entries fail too |
| security_baseline | no dynamic-execution / unsafe-deserialization patterns in backend code; the four security response headers are set in the apps layer |
| a11y_static | the static accessibility floor over frontend HTML: lang declared, images alted, controls and buttons named, no positive tabindex |
| perf_budget | frontend asset weight per class stays inside `frontend/budgets.json`, and the field-vitals thresholds live there as positive numbers (a notice, never a failure, while no budget file exists) |
| value_source | no document restates a source constant: the length cap, the sample port (the README quickstart keeps one literal), or a field-vitals threshold — docs state the rule and name the source |
| restatement | no sentence of ten words or more is restated across tracked documents — one home per rule, the second document carries its delta or a pointer; fenced specimens are not read, and deliberate duplication is named in the scanner's exception registry |

Portability exceptions: only files named in the scanner's
`EXCEPTION_FILES` registry may carry a directive line naming
one exact matched string and its reason (em-dash separated);
a directive anywhere else is itself a finding, and exceptions
never apply to the denylist.

## Store contract tests

Where a store port exists, the gate's suite carries one
contract test per port, run unchanged against every store
implementation (the fake included): load/save round-trip,
replace-on-save, empty-before-first-save. A storage swap that
breaks the contract fails in the gate, not in the services.
A regenerable-class store substitutes its drill: rebuild its
state from source into the fake and compare.

## Adding a scanner: the quartet

A scanner lands as four pieces, all in one change:

1. the module under `backend/foundation/scanners/`,
2. its entry in `registry.py`'s `ALL_SCANNERS`,
3. its mirror test `tests/test_scanner_<name>.py`
   (tmp-tree fixtures, seeded violations + clean cases; the
   registry test fails if any registered scanner lacks one),
4. its line in the table above.

## Standing check practices

Checks that run on a cadence or on a trigger, above the
gate's per-change legs.

### The catch-net pair

Two nets sit above the unit tests, aimed at what units cannot
see:

- **Surface-sanity net** — a test over the shipped surface
  itself (the sample's is `tests/test_surface_net.py`): the
  furniture is present (title, landmarks, status region), the
  viewport is declared, no fixed width overflows a 320 px
  viewport, and every declared text color meets the contrast
  floor against the page background. A project with themes
  runs the same contrast computation per theme over its token
  pairs. This net is also the automated leg of the
  accessibility rule — a regression net, never an
  accessibility verdict (fundamentals, accessibility target).
- **Route-coverage enrollment** — the `route_coverage`
  scanner above, exercised as a net: enrollment in
  `spec/route-coverage.md` names the check that exercises
  each route, so coverage is a tested claim, not a list.

### Misclick audit

Periodically — and whenever a surface gains committing
controls — inventory every committing control and classify it
by reversibility: **A**, one tap and irreversible, or bulk;
**B**, costly to reverse; **C**, safe. The inventory lives
with the frontend spec; class A and B controls route through
the guard kit (`docs/primitives.md`) or carry a written
exemption. The audit's seed finding, recorded before any
inventory exists: the absence of any confirm dialog on a
committing surface is itself the headline — "no guards found"
is the first row, not a pass.

### Production-shaped fixtures

Test fakes are built from real captured payloads, preserving
production structure — labelled pairs, grouped and composite
fields, empty and missing members. A simplifying fake that
flattens that structure is rejected: it can pass while the
real shape fails. Each parser, join, and serializer keeps at
least one production-shaped specimen (the sample's is
`tests/fixtures/model-payload.json`, captured from the model
builder over the sample store; `tests/test_fixtures.py` pins
the builder's output to its shape). Refresh the capture when
the real shape is learned to have changed, in the same change
that learns it.

### External asset preflight

An externally referenced image is shipped only after a
browser-like probe passes: final 2xx, image content type and
magic bytes, no hotlink refusal under a cross-origin referer,
no watermark, no expiring or redirecting URL. The probe result
is recorded with the asset's entry in
`frontend/assets-manifest.json` (the `asset_manifest` scanner
enforces registration). A CDN thumbnail is a preview, never
the durable copy; a selected asset is ingested into
project-owned storage.

## Denylist provisioning

Personal literals live in an untracked plain-text file, one
literal per line (blank lines and `#` comments ignored).
Resolution: the file named by `STARTER_DENYLIST_FILE` wins —
set but unreadable means the leg reports itself unconfigured
and does **not** fall back; otherwise the default
`var/config/denylist.txt` applies when present. With neither,
the scanner emits exactly one notice and the gate still
passes. With a list provisioned, every hit is an error
finding: rule, path, line — the literal and the line's
content are never printed, and the list file itself is
never scanned. In conversion mode the denylist is provisioned
from the predecessor's personal literals at conversion time
(see `docs/conversion.md`).

## Example configs — patterns noted, not implemented

Upgrade paths surveyed from larger fleet/external repos. Each
is a documented pattern here, deliberately not code:

- **Import-graph lineage targeting.** Reverse-dependency BFS
  over a cached AST import graph, with prose-only changes
  detected by comparing docstring-stripped AST dumps, docs-only
  changes skipping tests, and root-config changes forcing the
  full suite. The upgrade when mirror targeting outgrows a repo.
- **Self-tuning worker calibration.** Scope-keyed timing
  profiles recorded on every gate run choose the xdist worker
  count, capped by a memory ceiling. The starter keeps
  `--workers` explicit instead.
- **SQL-interpolation dataflow scanner.** Safety proved at the
  query sink (escaping-helper whitelists, rebinding-aware
  locals, audited per-module exemptions each carrying a written
  safety claim) rather than banning string building near SQL.
  The pattern for any repo that grows a database sink.
- **Governed-literal / single-owner scanners.** Constant-folding
  AST checks that a shared default's value may not reappear at
  governed call sites or be redefined outside its owner module:
  one owner per fact, enforced semantically. The same idea
  recurs per domain (canonical JSON, date patterns, digests).
- **Regex-builder DSL + identifier tokenization.** Hand-written
  multi-branch alternations must go through a builder that
  orders longest-first and anchors; name-matching scanners
  tokenize identifiers (snake/camel split) before matching, so
  a filename variable is not mistaken for a name.
