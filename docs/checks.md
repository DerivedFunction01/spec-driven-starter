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
| length | no file over the 800-line cap (Python + frontend scripts) |
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

Portability exceptions: only files named in the scanner's
`EXCEPTION_FILES` registry may carry a directive line naming
one exact matched string and its reason (em-dash separated);
a directive anywhere else is itself a finding, and exceptions
never apply to the denylist.

## Adding a scanner: the quartet

A scanner lands as four pieces, all in one change:

1. the module under `backend/foundation/scanners/`,
2. its entry in `registry.py`'s `ALL_SCANNERS`,
3. its mirror test `tests/test_scanner_<name>.py`
   (tmp-tree fixtures, seeded violations + clean cases; the
   registry test fails if any registered scanner lacks one),
4. its line in the table above.

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
never scanned.

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
