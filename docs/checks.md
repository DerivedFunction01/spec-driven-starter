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
fails the gate; **notice** prints but never fails.

Every scanner is repo-scoped and on by default: its
population derives from the tree it scans, never from a
declaration a package or folder makes, and a consuming repo
carrying a subset of the registry is drift, not a binding.
A scanner that cannot run without provisioning does not
pass quietly — unconfigured is an error finding. One
scanner's data is untracked by design: the denylist's
literals are personal and live outside the tree. That
scanner runs by default regardless — the list supplies its
literals where one is provisioned and never affects its
standing; with no list, it reports nothing.

| Scanner | Rule in one line |
| --- | --- |
| length | no tracked code file over the length cap the scanner's constant sets — every tracked code file counts by default, with no coverage register; the creep band below the cap lists on every run as a notice, and a band file grown past its committed `HEAD` count is a finding |
| portability | tracked text references only what a fresh clone resolves: no absolute or home-anchored paths, no owner's name, no specific untracked plan files; with a repo set provisioned, tracked code names no other repository |
| denylist | no personal literals from the denylist where one is provisioned (below); with none, the scanner reports nothing |
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
| perf_budget | frontend asset weight per class stays inside `frontend/budgets.json`, and the field-vitals thresholds live there as positive numbers; a frontend with no budget file is itself a finding — the budget is a spec decision the repo owes |
| value_source | no document restates a source constant: the length cap, the sample port (the README quickstart keeps one literal), or a field-vitals threshold — docs state the rule and name the source |
| restatement | no sentence of ten words or more is restated across tracked documents — one home per rule, the second document carries its delta or a pointer; fenced specimens are not read, and deliberate duplication is named in the scanner's exception registry |
| time_ownership | date/time derivations (parse, normalize, format, epoch, homed now wrappers) live in the one module the scanner's family map names; foreign calendar machinery and sliced instant fields outside the home are findings, and a sanctioned copy that stops matching its shape fails as stale |
| path_discipline | climbs to a root, cwd-derived roots, and home-anchored literal roots occur only inside a paths module or under a declaration carried in the scanner's data; a declaration whose file lost the pattern fails as stale; a hardcoded PATH assignment literal in tracked shell is a finding — scripts source the tree's one environment anchor |
| writer_uniqueness | writes that truncate a state-shaped target and hand-rolled stage-then-rename sequences occur only at the designated writer home or under a declared seam; a seam whose file lost the pattern fails as stale |
| adapter_mirror | every class implementing the store protocol defines the protocol's whole method set, which the scanner reads from the protocol class itself; the population is every module in the adapter tier, derived from the tree — no module is declared; partial implementations need an allowlist entry, and an entry covering a class that now mirrors fully fails as stale |
| folder_density | no folder over the direct-child file cap the scanner's constant sets — every folder and every tracked file of any kind counts by default, with no coverage register; the band below the cap lists on every run as a notice, and a band folder grown past its committed `HEAD` count is a finding. Compliance is achieved by grouping: a family that would push a folder over the cap gets its own grouped home along the module's real seams. The band is a warning state on the way to a grouping, never a steady state to park in; scattering a family's files across folders to stay under a count is the same workaround under another shape — a parked band folder and a scattered placement are both findings in substance, cured by grouping, not by placement |

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
gate's per-change legs. The adoption census for checks proven
in the Steam Power and Workhorse superapp repos — each with
its starter verdict and disposition — is
`docs/check-adoption-census.md`; a candidate joins that census
before it joins the starter.

### The catch-net pair

Two nets sit above the unit tests, aimed at what units cannot
see:

- **Surface-sanity net** — a test over the shipped surface
  itself (the sample's is `tests/served/test_surface_net.py`): the
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

### Rendered legs

The gate's legs read source; these legs read the built,
served page in a real browser. They run on a trigger — a
landing that touches a rendered surface, and on whatever
cadence the project sets for its census — through the
shard entry below, not inside `check.py`. The webapp
flavor seeds them: the specs and config under
`tests/e2e/`, the runner at `tools/e2e-shard.mjs`. Every
leg carries a synthetic capability test in its own file —
a page seeded with the leg's defect class must come back
flagged, a clean page empty — and runs it as part of the
family: a ruler that has never been seen red is not a
guard, and a leg that cannot produce its measurement has
not run.

- **Entry.** `node tools/e2e-shard.mjs <family>` is the
  one committed invocation. It checks its partition first
  (every spec file on disk claimed by exactly one family;
  an unassigned, double-assigned, or missing file fails
  before anything runs), gives each shard its own port and
  scratch directory, ensures the browser binary, and
  requires the port free before the run and again after it
  — a port still bound at the end is a teardown failure.
  With `--sha`, HEAD and the tracked tree must match the
  named commit before a leg measures anything: a verdict
  names the tree it was measured on. Families: `qa` (the
  legs below) and `app` (the project's own surface specs).
- **The census.** `tests/e2e/surface-routes.ts` enrolls
  every user-facing route — its pattern, the concrete
  seeded path the legs drive, whether it renders, and the
  navigation landmarks it carries. The legs iterate the
  census and nothing else. A route joins when it is built,
  not after it breaks; a route that cannot yet pass is
  enrolled with its measured failure recorded beside it,
  and the record carries the defect without excusing it.
- **Axe leg** (`qa-axe.spec.ts`) — the rendered
  accessibility verdict above the static floor: axe-core
  under the WCAG 2.2 AA tag set over the census, at the
  contract widths (390, 768, 1440) and in every appearance
  mode the product carries. Bar: zero critical or serious
  violations, per route, width, and mode.
- **Geometry leg** (`qa-geometry.spec.ts`) — no horizontal
  overflow at the contract widths, no interactive element
  obscured by another, no target under the 24×24 floor,
  and primary targets at 44×44 at phone width. The first
  mode runs every width; each further mode runs the phone
  pass, where mode-specific geometry breaks first.
- **Truncation ruler** (`qa-truncation.spec.ts`) — rendered
  text against its full text under ellipsis, clip, and
  line-clamp, plus text painted over by an interactive
  element. Failures are reported per viewport class, never
  pooled, and the bar is zero clipped or overlapped values.
  A drive that reaches no rendered surface measures zero
  text elements and reports a drive failure, not a pass.
  This is the rendered complement of the value-slots rule
  in the flavor's composed check: that rule bans the
  clipping shape in source, this ruler catches the clipping
  that arrives by layout instead of by declaration.
- **Dead-click sweep** (`qa-dead-click.spec.ts`) — every
  visible, enabled control in each route's declared
  landmarks is clicked for real, and a click counts only on
  an observable effect: a navigation, a hash change, a
  dialog opening or closing, the control's own state
  flipping, a popup, or its landmark closing. Controls are
  re-found by identity, never by collection position.
  Mutating or session controls are skipped with the reason
  in the verdict — the sweep never mutates state to prove a
  control alive — and scheme links and self-links are
  verified by their href contract instead of a click. This
  is the rendered complement of the misclick audit below:
  the audit inventories committing controls, the sweep
  proves the chrome's controls answer.
- **Parity leg** (`qa-parity.spec.ts`) — where an approved
  design reference exists, the built surface is captured
  and pixel-diffed against it. The manifest
  (`tests/e2e/parity-views.ts`) carries each view's
  reference, its mismatch-ratio limit where it argues one
  (the default is 0.02 of the diff canvas), and its masked
  regions in fractional coordinates, each with a reason;
  masks shrink the priced surface, never forgive pixels
  elsewhere. The per-pixel threshold is 16/255 per channel.
  Rows a shorter capture never renders count as
  mismatched, so height drift is priced in. A `pending`
  view is skipped by name with its owning work named;
  audit mode (`PARITY_AUDIT=1`) diffs every view and prints
  the table without failing, and a view is proven in audit
  mode before its status flips to asserted. References are
  approved artefacts and are never auto-updated: a
  reference changes only through the approval that changes
  the design.
- **Findings become pins.** A rendered defect confirmed by
  a critic run or by use becomes a spec in the `qa` family
  pinning the behaviour, landing with the fix where the fix
  is the project's — the family grows from findings, so a
  class caught once is caught by the gate thereafter. For
  a project on the generic UI kit, the kit's Specimen is
  the first surface enrolled: it joins the census and,
  once its render is approved, the parity manifest.

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
builder over the sample store; `tests/platform/test_fixtures.py` pins
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
set but unreadable resolves to no list and does **not** fall
back; otherwise the default `var/config/denylist.txt`
applies when present. The convention is one per repo: that
single env var and that single default path are the whole
provisioning surface. A subsystem or component env alias
naming its own list copy is a divergence to collapse, not
a second form — every consumer in the repo resolves the
same one list. Collapsing divergent lists takes their
union as the converged content basis: no literal is
dropped by a collapse, and a literal leaves the list only
by a deliberate removal, never by convergence. The list
is per-repo: each repo provisions the literals its own
tree must not carry. With a list provisioned, every hit is
an error finding: rule, path, line — the literal and the
line's content are never printed, and the list file itself
is never scanned. With no list, the scanner reports nothing
and the gate is exactly as it would be without one. In
conversion mode the denylist is provisioned from the
predecessor's personal literals at conversion time (see
`docs/conversion.md`).

## Repository-set provisioning

The portability scanner's external-repository leg follows
the same provisioning form. The sibling repositories a
repo's tracked code may not name live in an untracked
plain-text file, one name per line (blank lines and `#`
comments ignored): the file named by
`STARTER_REPO_SET_FILE` wins — set but unreadable resolves
to no set and does **not** fall back; otherwise the
default `var/config/repo-set.txt` applies when present.
With a set provisioned, a tracked code file naming
another repository in the set is an error finding (rule
`portability/external-repo-ref`); the repo's own name is
not an external reference, and docs and data are outside
the leg's population. Repositories are referenced through
registry/config data, never through literals in code.
With no set, the leg reports nothing.

## Instance content in data populations

Tracked fixtures, job definitions, registers, and seed or
sample data carry generic placeholders only.
Instance-shaped content in those populations — a real
mailbox, a real run record, an instance's names and
facts — is a finding of the same class as a literal in
code, convicted by the same legs: the provisioned
denylist and repo set, the path anchors, and the
credential shapes all scan those populations, and no
fixture, register, or seed population is exempt from a
text scanner's population. A bare export of the tree,
read cold, yields no profile of any instance or person.

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
