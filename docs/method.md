# The Method

Spec-driven development, distilled from a rebuild that replaced a
working prototype with a clean implementation without losing any
of its behavior. The method has six moves.

## 1. Reverse-engineer the spec from the evidence

When a predecessor exists, it is the oracle: what it *does* —
shipped code and observed behavior — is the evidence for what the
successor must do, and what it got *wrong* is catalogued with the
same care, so the successor designs around it instead of
inheriting it. Where a predecessor document and its code
disagree, the code wins, and the extraction says so. When no
predecessor exists, the same discipline applies to the problem
statement, the data, and any reference material: the spec records
evidence and citations, never aspirations.

A project declares its mode in `SPEC.md` — `greenfield` (the
default) or `conversion`. Greenfield follows the six moves as
written. Conversion adds a characterization-first track on top
of this move: the predecessor is inventoried, its failure modes
catalogued, and its behavior captured as golden fixtures before
the track specs are extracted. Read `docs/conversion.md` before
extracting a conversion's spec.

The spec is many small files behind an index (`SPEC.md`) that
carries no content of its own. No spec file grows past roughly
800 lines; material that outgrows a file gets its own file and a
row in the index map. Section numbering, once published, is
stable: amendments keep numbering, date themselves, and cite the
ruling or evidence behind them. A behavior change amends the spec
in the same change that implements it.

## 2. Split tracks, join them at one seam

Work splits into tracks (here: backend and frontend) with
separate spec files and separate fundamentals, because the two
sides fail differently and are reviewed differently. They meet at
exactly one contract — `API.md` — which is a shared, versioned
document, not a third spec. Neither track imports the other's
code, reads the other's internals, or grows a side channel. A
contract change is a versioned amendment, never a silent drift
on one side.

Each track has a **gate**: the owner rules on the track's spec
before application code for that track begins. Documentation,
plans, and harness files are not application code.

## 3. Fundamentals and primitives before features

Each track keeps a fundamentals document: its layering, its
seams, its conventions, and — crucially — the predecessor
evidence each rule answers. Rules without a warrant become
folklore; the warrant is what lets a future reader tell a load-
bearing rule from a habit.

Shared building blocks are named once in a primitives document
(`docs/primitives.md`): the settings seam, the store interface,
the model builder, the gate, the plan file. Features are
composed from primitives; a feature that needs a new primitive
adds it to the primitives document first.

## 4. Layer downward only

Code is grouped by intent (what it is about) inside layer tiers
that say what it may touch:

```text
apps        callers and the composition root: parse, wire, dispatch
services    orchestration and the read side: model builders, actions
infra       machinery: stores, file I/O, egress — knows how, never why
domain      pure rules and types: no I/O, no clock, no environment
foundation  the seam layer: settings, paths, ids, errors
```

Imports point downward only and the graph is acyclic. A file's
folder is its stereotype: a file in the wrong folder is a defect
the reviewer flags, not a style preference. The backend owns all
semantics — derivations, joins, status computation, and
machine-enum to human-label mappings — and serves them
display-ready. The frontend renders; the only client-side
computation allowed is arithmetic over values the backend
already served. A value the frontend needs but the model does
not carry is an API gap filed against the backend, never a
client-side patch.

## 5. Plans are the work record

Every implementation is a plan file (syntax:
`docs/plan-template.md`): objective, rulings, steps with files /
verify / done-when, and open questions in the structured
question format so a viewer can surface them for ruling. One
todo file per step, created before work starts, moved at each
transition (todo, doing, done / blocked) — chat is not the
progress record. A plan implementation carries a status-update
interval of 15 or 30 minutes, never longer.

**Closeout discipline:** when a plan lands, in the same pass its
status becomes `complete` and the file moves to the finished
archive. Remaining work never holds a landed plan open: it is
written up as a followup plan, and the older plan archives naming
the followup as its carrier. A completed plan is never edited
again.

## 6. Mockups are specifications

An approved mockup is an exact specification, not inspiration.
Mocks contain only shippable content; explanation lives outside
the mock. Every control in a mock has a determined real behavior
— a button that no backend serves is not drawn. Anything in an
approved mock that real data cannot reproduce returns as an
explicit exception *before* a substitute ships; honest absence
(an empty state, a null) is a legitimate rendering, a fabricated
value never is. The same test governs the live UI. Full standard:
`docs/mockup-approval.md`.

## Enforcement, not memory

Each rule above has a mechanism: the gate (`check.py`) enforces
the line cap and portability mechanically; the settings seam is
one module a reviewer can grep for; layering is visible in the
folder tree. A rule that recurs as a correction gets turned into
a mechanism, not repeated louder.
