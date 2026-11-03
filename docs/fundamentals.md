# Fundamentals — field-kit inventory (sample)

The layout authority for the sample domain. A real project
rewrites this file for its own domain, keeping the structure:
organizing principle, the tree, the import rule, the seams, and
the warrant for each rule.

## Organizing principle: group by intent

Code is grouped by what it is about (kits, items, readiness),
inside layer tiers that say what it may touch. Grouping by
technical kind across all intents (one folder of every parser,
one folder of every driver) is prohibited: it scatters everything
about one intent across five trees.

## The tree

```text
backend/
  foundation/   settings, errors, ids. Imports nothing internal.
  domain/       pure rules: kit completeness, readiness status.
  infra/        the store (JSON file or memory), file I/O.
  services/     the model builder: one function per API section.
  apps/         the HTTP server: parse, wire, dispatch. No logic.
frontend/       static client; consumes API.md only.
ops/            the supervision kit: unit template, installer,
                serve script, watchdog (see below).
```

## Import rule

`apps` may import `services`, `infra`, `domain`, `foundation`.
`services` may import `infra`, `domain`, `foundation`.
`infra` may import `domain`, `foundation`.
`domain` may import `foundation` only.
`foundation` imports nothing internal.
No upward imports, no cycles, no reexports: import from the leaf.

## Seams

- **Settings seam.** `backend/foundation/settings.py` is the only
  module that reads the environment. Host, port, unit name, data
  path, and thresholds resolve there, with defaults a fresh
  clone runs on.
- **API seam.** `API.md` is the only contract with the frontend.
- **Store seam.** `backend/infra/store.py` defines the store
  interface; services depend on the interface, so a file store,
  a memory store, and a test fake are interchangeable.

## Supervision

An always-on server is supervised, never merely started.
Hosts are replaceable: a deployment can replace the host
wholesale — system configuration outside the repo is wiped
and every unsupervised process dies with it, silently. The
kit in `ops/` is the mechanism: a unit template whose values
render at install time from the settings seam, an installer
that can re-render the unit on a bare host, a serve script
that delegates to the supervisor whenever the unit is
installed, and a watchdog restore ladder that an external
keeper polls. The supervisor contract is abstract — starts
at boot, restarts on failure, health-probed by the keeper —
so a non-systemd host supplies its own renderer behind the
same ladder semantics. A successful restore is routine and
silent; only ladder failure surfaces to the operator.

## Warrants (evidence each rule answers)

- One seam: a predecessor grew a second, client-side copy of the
  domain model; the two copies disagreed and both shipped. The
  backend-owns-semantics rule in `API.md` is the answer.
- Settings in one module: machine assumptions scattered across
  call sites made a working program fail on a second machine for
  reasons no single file explained.
- Small files, mechanically capped: a predecessor's single
  living document and single code tree became unreviewable; the
  800-line cap in the gate is the mechanical form of this lesson.
- Supervision, restorable from tracked source: a predecessor's
  companion server, started by hand with no supervisor, died
  with its host again and again in a single day, silently each
  time; the supervision kit in `ops/` is the answer.
