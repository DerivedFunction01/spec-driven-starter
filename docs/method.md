# The Method

Spec-driven development, distilled from a rebuild that replaced a
working prototype with a clean implementation without losing any
of its behavior. The method has six moves.

## Before move 1: the pre-build conversation (greenfield)

A greenfield project starts with a structured planning
conversation, before any spec work. One question at a time;
vague answers get pushback, not transcription — "users will
manage their stuff" is not an answer, the named user, the named
stuff, and the named actions are. The conversation works a
fixed inventory until scope is explicit in *and* out:

- **Product** — who it is for, the job it does, what success
  looks like, what is deliberately not in scope.
- **Technical** — data it keeps, integrations it needs,
  always-on or invoked, where it runs.
- **Design** — surfaces and their states, design references,
  imagery, the visual register.
- **Process** — who rules on gates, how work ships, what the
  landing proof is.

Two kinds of answers come out of it. The **audience-and-
persistence declaration** is asked on every project: who uses
the app, whether their entries are saved, and whether it needs
a public link, a custom domain, or a team — the hosting shape
follows from those answers, and the tradeoff (for example,
public link versus saved data) is ruled explicitly, not
discovered after build. The declaration also classifies each
store the project keeps — regenerable, local-durable, or
shared-production — because the class, not the mere existence
of a database, decides what migration and backup machinery
the project carries. The **conditional questions** are asked
only when their trigger is in play; each names the starter
material its yes answer activates:

| Question (asked when the trigger is in play) | A yes activates |
| --- | --- |
| The project takes form submissions | Form specification primitive; submission-data stability rule |
| The project books appointments or slots | Time-and-booking primitive |
| The project quotes prices | Price-and-terms quote primitive |
| Records carry more than one lifecycle | Orthogonal state axes primitive |
| The project integrates third-party services | One integration record per service |
| The project syncs state to an external system | Sync lifecycle primitive |
| The project offers a demo or specimen sign-in | Specimen seed primitive |
| The project ships a UI shell with editable views | Brand-link dirty guard primitive |
| The project emails self-service access or recovery links | Possession-based authorization rule |
| The project ships imagery or accepts user media | Imagery discipline; media store-port contract |
| The project references external assets | External asset preflight check |
| The project ships layout-bearing deliverables | Rendered-output verification |
| The project collects personal data | Personal-data inventory in the spec |
| The project keeps state that rebuilds from source | Persistence class: regenerable — no migration machinery, recorded as a decision |
| The project keeps durable state on one machine | Persistence class: local-durable — migration policy (versioned local transforms) |
| The project keeps a persistent database with live data | Persistence class: shared-production — migration policy in full; expand–contract primitive |
| The project keeps persistent user data worth restoring | Backup and restore-rehearsal rule |
| The site must be found by search | Discoverability file |
| Pages are public or conversion-critical | Full performance budgets (otherwise a lighter budget) |
| The project is a design-led build, or its market has visible reference apps | Inspiration pin board |
| The project's readers include non- or beginner coders | Plain-language register |

Every answer is recorded in the project's spec (the intake
record in `docs/spec-template.md`), with its scope. A yes
creates exactly the conditional sections, templates, and
primitives it names — in that project, not in the starter's
defaults. A no leaves no trace: no section, no rule, no
placeholder. The questions are asked once, here or at
conversion intake; a feature that later crosses a trigger
re-opens the one question it crosses, recorded the same way.

The conversation ends by generating the project's starting
files from the recorded answers rather than handing over blank
templates: for each template the starter ships (spec files,
fundamentals, plan, and the conditional templates its yes
answers activated), the generation prompt is the same shape —
*from the intake record, draft this file: carry over every
recorded answer verbatim where the template asks for it, mark
each claim the record does not settle as an open question in
the file's own format, and invent nothing the record does not
contain.* A generated draft the record cannot support is a
finding about the conversation, not a detail to improvise.

Conversion projects run the counterpart intake in
`docs/conversion.md`; the conditional questions and the
audience declaration are the same.

## Wishes and specs

Requirements arrive in two kinds, and the method treats them
differently. A **wish** is a desired outcome stated without
rules: "the customer should get the invoice when the job
starts." A **spec** states the rules, constraints, edge
cases, and failure paths, and names its decisions.

Nothing builds from a wish. A wish is converted by a planning
pass: the pass works out the rules the outcome implies and
ends in a **decision list** — the open questions, each owned
by whoever has the standing to answer it. The spec is
adopted by a **dated ruling** on that list; only then does a
build implement it. A provisional default offered during the
pass is not a ruling, and silence is not one either.
Questions nobody has ruled on wait in the spec's register of
open decisions — they are never settled by a builder's
assumption, because an assumption ships silently and a
register entry waits visibly.

The doctrine lives in the repo, not in the builder's memory.
This section states it; each project's own fundamentals
carry the standing rule (the fundamentals template keeps the
section), so a later owner of the repo — coder or not,
working from a fresh clone — learns how requirements become
buildable from the clone itself.

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
carries no content of its own. No spec file grows past the
gate's length cap; material that outgrows a file gets its own file and a
row in the index map. Section numbering, once published, is
stable: amendments keep numbering, date themselves, and cite the
ruling or evidence behind them. A behavior change amends the spec
in the same change that implements it. Tracked documents state
the present: when a consolidation pass finds an amendment whose
substance has been stable, it folds into the body it amends and
its dated layer retires to the change history. The exception is
named, not discovered — a versioned contract's amendment record
keeps its layers, because there the layering is the discipline.

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

**Plan altitude and timing:** because features group by
intent (§3, and each track's fundamentals), detailed plans
are written at the intent-group level, just ahead of that
group's build — not for small features far ahead of their
time. An early small-feature plan goes stale against a
moving tree and ends up re-derived or wrongly trusted. A
group plan states only the rules a small feature needs to
stay coherent with its group, in a line or two; the
feature's own detail is written when its group is next up.

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

The six moves assume the standing process rules that follow.
Each names where its record lives; a practice with no record
did not happen.

## Demo-first landing

A portion is reported only after it deploys and passes a
both-ends smoke *on the deployment itself*: the public routes,
a specimen sign-in where one exists, and one guarded surface.
Reports name the deployed commit and what to click. A local
pass is a precondition, never the report. Record: the landing
note in the portion's plan todo, with the deployed commit.

## Study pattern

Anything not solid — missing, or carrying friction — gets a
before/after mockup study before it is built (move 6 governs
the mock itself). Defaults in a mock are staged honestly: an
off-by-default control is shown off. A before that cannot be
captured is labeled a reproduction, never passed off as a
capture. The owner picks by a copy-back verdict payload, and
the picked study is the spec for the build. Full protocol:
`docs/study-rounds.md`. Record: the study
artifact and its verdict, in the plan that builds it.

## Artifact lifecycle

A study or mockup artifact is deleted when its subject is
implemented, riding the landing change. Notes and screenshots
are the permanent record; the artifact itself is scaffolding,
and scaffolding that outlives its build becomes a second,
stale spec. Record: the deletion lands with the implementation
it specified.

## Post-landing passes

**Performance pass.** An improvement that preserves results
runs without a separate approval (the standing rule sits in
`docs/fundamentals.md`); as a pass it is: profile first,
change one variable at a time, then prove identical output
and the measured gain, in that order.

**Consolidation pass.** A named, recurring cleanup that
dissolves what accretes in log shape — appended sections,
flat rule lists, amendment tails — back into a document's own
structure: appendix buckets dissolved, flat logs grouped under
named heads, a rule restated in a second place trimmed to its
delta or a pointer, finished history compressed out of tracked
documents. It changes no rule's substance; a consolidation
that would is an amendment, ruled as one. Deliberate layering
is not accretion: a versioned contract's amendment record
stays layered. Cadence is the project's own ruling, recorded
in its spec. Record: the pass's landing note, naming what
folded and what retired.

## Worktree lanes

Feature work builds in sibling worktrees on feature branches —
typecheck and unit tests run in-tree, in the lane. Merges into
the main branch stay serial, ancestry-checked, with the full
gate per merge. Lanes never commit to the shared branch; the
coordinating agent gates, commits, and verifies. Record: the
bundle's todo files, one per lane step.

## Parallel by default

Work that can run in parallel — lanes, tests, gates, compute —
never runs serially for convenience. Serial order binds only
where a shared reference makes it a correctness gate: merges
into the main branch, one at a time, ancestry verified. A long
serial run of parallelizable work is a defect to report, not a
pace to accept. Concurrency inside the product is a different
question: a product that is itself concurrent names its model
in its spec.

## Unit decomposition and build order

Work is cut into units: one visible, verifiable result, within
one system boundary, buildable in one session. Adjacent units
with no standalone result between them merge. Order:
dependencies first; security before the functionality it
protects; backend before frontend wiring; UI shells before
real data; packages installed just-in-time, in the unit that
first needs them. Record: the plan's step list is the unit
list — a step that fails the unit test is re-cut, not endured.

## Diagnosis loop

A hard bug or regression is worked in one fixed order: build a
reproduction; minimise it; rank a few hypotheses; instrument
one variable at a time; fix; add the regression test; then
clean up the instrumentation. No fix is attempted before the
reproduction exists, and two variables are never changed in
one step — an unreproduced fix is a guess wearing a patch.
Record: a short post-mortem note with the fix (what reproduced
it, which hypothesis held, what the regression test pins).

## Verify in the target runtime

Before an environment failure is diagnosed, name the process
that will actually run the work — supervisor unit, cron,
deployed serve — with its home, PATH, working directory, user,
and interpreter differences from a dev shell recorded. A shell
result is a hypothesis about that runtime, never proof; a
health response alone does not prove a restart or a fix.
Fixes land in the durable template or config that recreates
the service. Reports separate target-proven from shell-proven.
Record: the run record for the drive, marked with which kind
of proof each claim carries.

## Rendered-output verification

*Active when the intake answers yes to: ships layout-bearing
deliverables.* Anything whose value is its layout — a page, a
PDF, a confirmation — is verified from its rendered form
(screenshot, rendered page, live deployment), not from source
or extracted text; text extraction is for wording checks only.
A build that could not render is reported as unchecked in that
respect, never as passed and never as absent content. Record:
the rendered evidence cited in the landing note.

## Release and rollback discipline

Build once; promote the same artifact through every
environment — only injected configuration differs. A release
is an immutable, addressable unit (artifact plus config) whose
rollback is prepared *before* it ships: the previous artifact
retained, migrations backward-compatible with the previous
release (expand–contract, `docs/primitives.md`), rollback
rehearsed in staging. Post-deploy smoke runs against the
deployment itself; a failed smoke or a symptom alert triggers
the prepared rollback, not an improvised fix forward. Record:
the release entry in the run record, naming artifact, config,
and the rollback it prepared.

## Alert on symptoms, budget the errors

*Active for always-on services (asked via the service
flavor).* The service declares a small set of user-facing
objectives — an indicator, a target, a window — and the error
budget that follows. Alerts page on symptoms users feel: burn
rate against that budget, in fast and slow windows. Cause
signals (CPU, queue depth, restarts) go to dashboards and
tickets, never pages. An exhausted budget is a recorded state
that changes what ships next. Record: the objectives and the
budget state, in the service's run record.

## Backup is a restore rehearsal

*Active when the intake answers yes to: persistent user data
worth restoring.* The spec names a recovery objective — how
much loss is tolerable, how long a restore may take — the
assembly carries a backup mechanism, and a scheduled rehearsal
restores the backup into a scratch environment and proves it
byte- or record-identical. An untested backup is reported as
no backup. Record: rehearsal results in the run record, like
any other gate.

## Enforcement, not memory

Each rule above has a mechanism: the gate (`check.py`) enforces
the line cap and portability mechanically; the settings seam is
one module a reviewer can grep for; layering is visible in the
folder tree. A rule that recurs as a correction gets turned into
a mechanism, not repeated louder.
