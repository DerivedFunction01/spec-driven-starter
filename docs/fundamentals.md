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
about one intent across five trees. Extraction groups by
intent too: reporting surfaces belong to an intent group and
derive from the same served sources the product uses — a
feature never grows a private query path to answer a
reporting question, so two reports about one intent are one
surface fed by one source, not two features' separate
queries.

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
  module that reads the environment. Host, port, unit name,
  environment identity, data path, and thresholds resolve
  there, with defaults a fresh clone runs on.
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

## Standing rules

Rules every project from this starter carries. Conditional
rules live in their own section below, each gated on an intake
answer; nothing there binds a project whose answer is no.

- **Settings-as-policy.** A legitimate either/or behavior is
  an admin setting with a safe default, not a ruling:
  capabilities ship off, thresholds are admin numbers seeded
  from config. A setting chooses *which* flow runs in front of
  a terminal commit, never *whether* a flow runs.
- **Cached display, live gate.** Displays may read from a
  cache; commit gates always re-derive live. Four cache
  classes: versioned documents (keyed by version), live
  aggregates (short-lived, labeled with their age), per-request
  (never outlives the request), and never (authorization,
  balances at commit, anything a stale read could mis-sell).
  A display that cannot name its class is a defect.
- **Honest absence.** Blank means unrecorded — never zero,
  never back-solved from a derived figure. A variance, a
  percentage, or an expectation is served only where both of
  its sides exist; where one side is missing, the surface
  serves the side it has and names the other absent.
- **Ports refuse honestly; assembly tells the truth.** A
  capability that is not graduated yet sits behind a port and
  refuses — a named error, never a stub that pretends. The
  assembly serves which adapter is live for each port, and an
  admin surface states it. Graduation swaps the adapter behind
  the port; callers never change.
- **Security baseline.** One named list, checked in the gate
  (`docs/checks.md`), not scattered care: secure defaults
  (debug and verbose errors off in production); security
  response headers set once at the edge or shell so every
  route inherits them; authorization checked per object and
  per function, never by an id from the request alone;
  parameterized data access only; login and sensitive
  endpoints rate-limited; sessions invalidated on logout and
  rotated on privilege change; a dependency and supply-chain
  scan in the gate.
- **Accessibility target and floors.** The spec names its
  conformance target — WCAG 2.2 AA by default for user-facing
  UI, overridable in the spec with the reason recorded. The
  token and primitive layer carries the floors: text contrast
  at least 4.5:1 (3:1 for large text and controls), visible
  focus never fully obscured, pointer targets at least
  24×24 CSS px, reflow at 320 px, no information carried by
  color alone, and authentication that never depends on memory
  or puzzle tests and permits paste and password managers.
  Testing is two-layer: the automated scan in the gate is a
  regression net, and a manual keyboard-plus-screen-reader
  pass over the core flows is a landing requirement — a clean
  scan is never reported as "accessible".
- **One instruction source.** The canonical agent
  instructions for a repo live in one file (`AGENTS.md`).
  Every other harness's file — a bridge file, an editor-rules
  entry, an assistant-specific instructions file — is a thin
  pointer to it, never a second copy: duplicated instructions
  drift and silently disagree, a pointer cannot. Reusable
  project procedures live as portable `SKILL.md` playbooks in
  the open agent-skills format, loadable by any compliant
  agent, not written against one vendor's proprietary hooks.
- **One glossary.** The project's domain terms are defined
  once in its glossary (template:
  `docs/glossary-template.md`): plain-word definition, the
  exact technical name it maps to, one example. Specs, plans,
  code names, and UI copy use glossary terms exactly; a
  concept with no entry is named and entered before it is
  built on, and a term argued about is defined in the same
  pass that argues it.
- **One source per constant.** Every changeable value — caps,
  thresholds, budgets, cadences, ports, paths — has exactly
  one machine source (the settings seam, a config file, a
  scanner constant, a served payload), and that source is
  where the value lives. Documents state the rule and its
  intent and name the source; they never restate the value,
  because a restated value is a second source that drifts
  silently when the first changes. A test pinning its
  source's value is a proof, not a copy; an external
  standard's named level is a name, not a tunable — the
  tunable numbers under it still live in the config source.
  The gate's restated-value scan enforces this over the
  docs.
- **Environment separation for state.** Production,
  development, and test resolve to distinct state roots and
  distinct credentials through the settings seam. A dev or
  test configuration that resolves to production state is
  refused at resolution, not warned about after the fact.
  The active environment's identity is a served fact on any
  surface that shows state, so no reader can mistake which
  data they are looking at.
- **Nothing builds from a wish.** A wish states an outcome
  without rules; a spec states the rules, constraints, edge
  cases, and failure paths, and names its decisions. A wish
  becomes buildable only through a planning pass that ends
  in a decision list, adopted by a dated ruling; a
  provisional default is not a ruling. Undecided questions
  wait in the spec's register of open decisions, never in a
  builder's assumption. This rule is stated here, in the
  project's own fundamentals, so it survives handover: an
  owner reading a fresh clone learns it from the repo.

## Conditional rules (intake-gated)

Each rule below exists in a project only when its intake
answer is yes (the intake record in the project's spec cites
this section). Until then it is not a default, a placeholder,
or a promise.

- **Possession-based authorization** — applies when the
  intake answers yes to *emails self-service access or
  recovery links*. A self-service link carries a hashed,
  single-object, expiring token; a bare id never authorizes.
  Recovery verifies against the contact on the record and
  answers uniformly whether or not a match exists, so the
  response itself leaks nothing.
- **Submission-data stability** — applies when the intake
  answers yes to *takes form submissions*. A field's id and
  meaning are stable once submissions exist; rewording or
  re-purposing a field creates a new field, and the change
  record states that new answers are no longer comparable with
  earlier ones. Reporting maps each answer to its field label,
  shows the respondent count per field, and keeps missing
  answers visible — never a total back-solved over silent
  gaps. (What a form may ask is the form specification
  primitive in `docs/primitives.md`.)
- **Third-party integration record** — applies when the
  intake answers yes to *integrates third-party services*.
  Each service gets one record (template:
  `docs/integration-template.md`) built from the provider's
  official docs, not memory: hosts, auth scheme, least scope
  requested, where the credential lives, and which operations
  are verified versus untested. Untested is labeled, never
  implied working; the first real call is a harmless read, and
  it — not the setup — is the proof. Clients are pinned and
  vetted before install. The record is what graduation swaps
  in behind the port (ports refuse honestly, above).
- **Personal-data inventory** — applies when the intake
  answers yes to *collects personal data*. Before features,
  the spec carries an inventory: each field's purpose, why it
  is necessary for that purpose, who can see it, and its
  retention period. Collection is the minimum per purpose,
  optional fields are genuinely optional, and defaults never
  expose data publicly. Retention is enforced by an automated
  deletion or anonymization job whose report is reviewed.
  Export and deletion of one person's data are designed
  operations, not support improvisations.
- **Performance budgets** — applies at full strength when the
  intake answers yes to *pages are public or
  conversion-critical*; other projects carry a lighter budget
  under the same discipline. Each template gets a budget in
  the spec — script, image, font, and total weight limits set
  for the audience's real devices and networks — enforced in
  the gate. Field targets are the Core Web Vitals thresholds
  (LCP, INP, CLS) at the 75th percentile, mobile and desktop
  separately; their values live in the budgets config
  (`frontend/budgets.json`), the single source, and a project
  overrides them there with the reason recorded in its spec.
  Lab and field results are
  reported as different facts; a lab pass never settles the
  field number. Images ship responsive in modern formats with
  dimensions set, fonts are self-hosted, third-party scripts
  load deferred.
- **Imagery discipline** — applies when the intake answers
  yes to *ships imagery or accepts user media*. No
  AI-generated or watermarked binary graphics (SVG exempt);
  binaries come from the project's own library or are recorded
  mechanical derivations of it. Every asset is
  manifest-referenced — an unregistered asset is a build
  error. User media uses the metadata/payload split defined
  with the media contract in `docs/primitives.md`.

## Warrants (evidence each rule answers)

- One seam: a predecessor grew a second, client-side copy of the
  domain model; the two copies disagreed and both shipped. The
  backend-owns-semantics rule in `API.md` is the answer.
- Settings in one module: machine assumptions scattered across
  call sites made a working program fail on a second machine for
  reasons no single file explained.
- Small files, mechanically capped: a predecessor's single
  living document and single code tree became unreviewable; the
  length cap in the gate is the mechanical form of this lesson.
- Supervision, restorable from tracked source: a predecessor's
  companion server, started by hand with no supervisor, died
  with its host again and again in a single day, silently each
  time; the supervision kit in `ops/` is the answer.
- Behavior ruled instead of configured: either/or behaviors
  settled by one-off rulings had to be re-litigated per
  deployment while operators needed the other branch;
  settings-as-policy is the answer.
- A port that pretended: an ungraduated capability stubbed to
  look live shipped a silent no-op as a feature; ports refuse
  honestly, and the assembly states which adapter is live.
- Instructions in two files: a repo whose agent instructions
  were copied into two harnesses' files watched them drift
  into quiet disagreement; one instruction source, with
  pointers, is the answer.
