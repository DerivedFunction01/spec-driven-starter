# Supervision rules

The generic supervision rules for an adopting deployment:
how work is staffed, watched, escalated, and recorded. Each
rule is stated once, here. A deployment's bindings file
names the roles below for its own systems — compute venue,
leased session, fleet capacity source, run-record store,
caller registry, work record, parent thread, verifying
party — and carries every named value (cadences, thresholds,
system names) the rules refer to. Repo files carry an
operative one-liner plus a pointer here, never a second full
statement.

A rule that depends on a compute venue states two forms.
Venue-present: the deployment runs leased sessions on a
venue. No-venue: there is no venue — work runs on the local
machine, the capacity source reports no sessions, and every
capacity rule binds vacuously. The same text is correct in
both worlds, and in any other venue shape (hosted sessions,
container instances) that fills the roles.

## The inline class

Four classes bind mid-task, unprompted; they are the inline
class, carried verbatim into adopting repos' entry-point
files by the synced fragment, and each is marked where it is
stated below:

- the hard-stop floor (Hard-stop floor);
- defect routing at diagnosis (Defect routing);
- claimed-instruction verification (Blocked states and
  claimed instructions);
- only a measure clears — an acknowledgement clears nothing
  (Staffing).

Every other rule binds at task start, at adoption, at
landing, or by design, and lives behind the read-order
pointer.

## Staffing

Staffing is measured against live venue capacity: the
sessions up set the expected worker count for a
compute-bound programme. A programme running serial or
one-deep while sessions idle is a staffing defect, surfaced
repeatedly until it is staffed; placement is the lane's
hands, never an owner decision. Venue-present: the measure
reads the fleet capacity source for the sessions up and the
run-record store for the workers observed. No-venue: no
sessions exist, the expected count is the local machine's
own parallelism, and serial local work is not a staffing
defect — the class binds only where idle capacity exists to
be idle.

**Inline class — only a measure clears.** An
acknowledgement never clears a staffing row; only a later
measure showing the programme staffed does. The same
clearing rule governs every supervision row in this file:
a row clears on the measure that shows its condition
resolved, never on an acknowledgement of the row.

A measure reads durable records: a condition is measured
from the records that constitute it — the run-record store
for work run, the landing record for work landed, the work
record for work recorded. A cache, a liveness probe, or
any other read that can flap independently of the fact is
not a measure. An expectation is only as good as its
trigger: an expectation whose trigger condition is keyed
to such a read is unmeasured from the moment it is set —
it reads false while the fact stands true in the records,
and the row it guards never escalates. Every expectation
names its durable source when it is set; a trigger with
no durable source is a defect of the expectation, not of
the work it watches.

Child workers are the count: a programme's workers are
served split by attribution — runs by the programme's own
coordinator callers in the caller registry, and child
workers, runs by every other caller attributed to the
programme. A coordinator fielding no child workers while
its programme has parallel work is the defect shape in its
pure form.

The fleet is the allocation unit: the staffing object
serves every live session with its running-run count
across all programmes. A live session carrying no runs
while any programme is understaffed, or while runs queue
on another session, is a fleet-level row of its own —
contention and idleness coexisting is a defect, not a
wash. Compute work spreads across every live session
rather than queueing on one. No-venue: there is no fleet,
and this rule binds vacuously.

Idle with work complete is its own class: a programme
whose work record shows its referenced work done while
its status stays non-terminal and nothing is in flight is
surfaced as idle-with-unlanded-work, with the minutes
since its last activity evidence.

A completed stage with no successor staffed is a staffing
defect: a programme terminal-done, or with its referenced
plan derived done, while its project holds approved
unstarted plans and it fields no workers, is surfaced
until a successor is staffed or the programme closes.

No lane is called idle from its record alone: before a
stall or staffing row reads a lane idle, the measure
cross-checks ground truth — the run-record store and the
work record's modified stamps on its referenced plans.
Work moving while the record stands frozen is a
missing-record defect of its own class, carrying the
checkpoint gap: the age of the lane's newest status post
against the armed progress-checkpoint cadence (a mechanism
default; its value is owned by the bindings layer).

Actuation is part of the measure: a supervision steer that
cannot reach an agent able to act is itself a defect after
one failed cycle, never a silent loop. When the dispatch
consumer reports a delivery failure for a send addressed
to an understaffed programme's thread, the next
supervision report carries an undeliverable row for that
programme addressed to the parent thread.

Escalation is timed, to the parent: a row starts in the
lane's hands; a row still unstaffed after the escalation
interval (a mechanism default; its value is owned by the
bindings layer) escalates to the parent thread and stays
escalated until a measure shows the programme staffed.
The parent step replaces endless direct re-pings.

The evidence is priced: every row serves its measured
sentence — active workers, child workers, per-session run
counts where a venue exists, idle-session minutes while
any queue waits, and the checkpoint gap — and every
stall-class row carries its stall duration, measured from
when supervision first saw the row, alongside the measured
size of the work it interrupts: the jobs run in the
window, the workers fielded, and the work's own expected
duration where a plan states one (unstated serves null,
never a guess). An escalation shows when the stall exceeds
the work it interrupts.

Owner-waiting outranks queue position: a deliverable the
owner has commissioned and asked for by name is not
ordinary queued work. Its commission stamp is a
first-class fact, tracked apart from the queue it sits in:
a status post may carry an owner-waiting declaration —
the deliverable's name and its commission time — and a
terminal status clears it. Routine machinery cycles never
legitimately hold an unstaffed owner-waiting item, and an
authoring-class deliverable (no venue, no gate) has no
capacity excuse at all. A declaration with no staffing
measure for its programme and no lane record newer than
the declaration, one check cycle past the commission, is
a defect row addressed to the parent thread from the
first report that can draw it — it does not wait for a
stall pattern, an escalation timer, or the owner's second
ask. A status ask about an owner-waiting item is priority
traffic for the owning thread — the answer precedes lane
work — and an ask the lane's record has not answered one
check cycle later is its own row to the parent. Both rows
serve the wait's price in minutes since the commission
stamp; neither depends on the fleet.

The mechanism is generic and registry-driven: one
evaluator supervises every programme the same way, and
everything programme-specific — the lanes' handles, the
checkpoint cadence, the staffing band, the escalation
bound, the venue, the standing rule text — is a
declaration in the supervision registry, never a
constant in the evaluator. A programme onboards by
declaring its row; its values bind its lanes only.
Declarations arrive two ways: a programme onboarding,
and arming — a work item's transition to doing arms a
registry row for it from the work record, and a terminal
transition retires the row. An armed row no status post
has named after two cadence intervals is itself a row:
work armed and silent. Worktree presence is filesystem
ground truth alongside the posts: declarations name the
programme's worktree roots, a standing worktree is
unfinished work whatever the posts claim, a terminal
claim does not clear a lane whose trees stand unlanded,
and a standing tree with no armed row and no live lane
is an unarmed-work row. A retiring tree after a verified
landing corroborates the disarm.

## Blocked states and claimed instructions

**Inline class — claimed instructions are verified, never
believed.** A blocked or stand-down state whose basis is a
claimed owner instruction must cite the owner's actual
message (thread and time). An uncited claim is a defect,
not a state, surfaced as its own row priced with the
frozen duration and addressed to the verifying party from
the first report; the verifying party holds the owner's
actual traffic, an unverifiable claim is void on detection
and the lane resumes under its standing authorization, and
the row never escalates to the owner as a question. A
cited claim is a state and draws no row.

Blocked is a supervised state, not an exit: only the
closed and hard-blocked states leave the ping set. Every
blocked record carries its cited basis and a verification
stamp; a blocked record with no stated basis draws its own
row to the verifying party, as does a citation the
verifying party has not stamped past one check cycle.
Neither class waits on the fleet.

## Waits on external conditions

A wait on an external condition — a session appearing, a
service restoring, a landing completing, a blocker
clearing — is a staffed posture only when it is
registered and armed. Registered: the wait is recorded
where supervision reads, naming the condition, the
waiter, and the act that fires when the condition clears.
Armed: the wait carries its own motion — a watcher or
retry keyed to the condition's durable record, or
checkpoints on the cadence naming the wait's state. A
wait parked on a status line, with nothing armed and no
cadence of its own, is not a posture: at the second
missed interval it is an idle defect, whoever owns the
wait, and it prices from when the condition in fact
cleared, as the durable records show it.

Clearance fans out to the register: when a condition
clears — a restoration, an all-clear, a blocker lifting —
the notice goes to every thread that registered a wait on
that condition, not only to the routes that happen to be
open at the time. A clearance that reaches only some
registered waiters leaves the rest waiting on a fact that
already stands; the unreached wait is a defect of the
clearance, and it clears when the notice is delivered,
not when it is sent on the routes that were open.

## The goal contract

Every programme runs under one goal contract: the template
below, instantiated once per programme in each of the
contract's two operational homes — the scheduler's job
definitions, as the header block of every programme-serving
job body, and the work record, on the programme's bundles
and todos. No other home carries a contract: a record that
runs nothing holds no programme's terms. The supervision
layer reads the work-record-carried contract as its
declaration source and dispatches continuation pings
against it.

The six fields:

- **Objective** — the outcome, in one or two sentences.
- **Complete when** — a verifiable condition: a landed
  SHA, a verdict record, a measured count. Never an
  impression.
- **Blocked only when** — a named hard stop, a genuine
  owner-only decision, or a verified external blocker.
  The claim carries its cited basis, with its time, and a
  verification stamp; an uncited or unverified claim is
  void — the work resumes under its standing authorization
  and the claim is surfaced as a defect. Sequencing
  choices, agent-clearable waits, and matters already
  decided are never blocked states.
- **Work record** — where progress is measured: the record
  the cadence reads.
- **Cadence** — conforming progress-checkpoints every
  15 minutes while doing; two missed intervals is a stall.
- **Continuation** — a step landing staffs the next in the
  same movement; a turn ends only with work in flight, a
  complete report, or a blocked report satisfying the
  Blocked only when clause. An acknowledgement does not
  clear a stall; measured movement does.

Fields-only variance: exactly four things differ per
programme — the programme name, Objective, Complete when,
and Work record. Blocked only when, Cadence, and
Continuation are verbatim in every instantiation; a
handwritten variant is a defect.

Start gate: a job body or work-record item with any
contract field empty is not created, armed, or staffed.
The starting thread restates the Objective verbatim in its
first progress checkpoint.

## Defect routing

**Inline class — route at diagnosis.** A defect in one of
the deployment's shared infrastructure systems is notified
to its owning thread with a fix commission at diagnosis —
never held for a hand-over, a closeout, or a defects list,
and never fixed ad hoc in the consuming thread. A defect
post naming such a system carries its routing — which
system, which owning thread was notified, when, and the
evidence pointer — or the post is incomplete. The measure
cross-checks and surfaces a visible-but-unrouted defect as
an unrouted-defect row addressed to the diagnosing lane,
escalating to the parent thread on the timed pattern; the
row clears when the notification exists, not when it is
acknowledged. The class does not depend on the fleet. The
bindings layer names the shared systems and their owning
threads.

## Plan shape and fan-out

Every plan carries its parallelization as a ruling: the
lane split over already-landed contracts, and each serial
exception with its named shared file or shared state. A
plan with no parallelization ruling is unfinished.
Adoption executes the plan's stated split and does not
re-derive one; plan numbering is not a dependency.

Serial-plan detection at adoption: fan-out is measured
when a plan is adopted, not when the owner audits it. An
adopted plan whose remaining steps are contract-
independent and which fields fewer lanes than it has
independent steps is an understaffing row at adoption
time, escalating on the timed pattern. Lanes are counted
from the live statuses sharing the plan reference; the
step counts are declared on the status references (steps
open, steps independent), and a plan with no declaration
draws no row rather than a guessed one.

## Landing and records

Landing moves the record: whoever lands work that
completes another plan's step updates that plan's record
in the same turn, or notifies its owning thread in the
same turn — a record lagging its landing is a defect of
the landing, not of the record-keeper. A gate-green,
self-contained delta lands incrementally as soon as it is
green; holding green work for a whole-branch landing needs
a named shared-state reason, stated where the hold is
recorded.

Landing order between parallel streams is agent-clearable:
when streams serialize on a measured overlap, the owning
threads choose the order — gate-complete first, ties by
rebase and re-gate cost — and execute it. An ordering
choice differs only in sequence, not scope or outcome, and
is never escalated as an owner blocker; only scope,
outcome, and the hard-stop classes go to the owner.

## Venue use

Sessions are shared computers, not queues: another
programme holding a session is never a reason for a gate
to wait. Draws co-run on live sessions, sized down to
measured headroom (cores, memory); ports are
single-occupancy and stay distinct per lane; a measurably
starved draw is reported as a sizing fact, never silently
re-queued. No-venue: there are no shared sessions and no
draws; work runs locally and this rule binds vacuously.

Work on a reduced-capability venue tier states its
justification where it reports status — unprompted, at the
point of choice; when a full-capability session is up, the
justification names why it was not used. No justification
that survives stating means the work moves to the
full-capability tier instead. No-venue: the local machine
offers no tier choice, and nothing is owed.

## Status vocabulary

A status report is grouped, never a bare code: it carries
exactly the groups its state selects, one line per group,
a group with nothing to report omitted and never filled
with a placeholder. The done group names the work items
flipped since the last report wherever work items exist;
summary-form done is legitimate only at the two closing
states. Work running past an hour while its thread stays
active states itself under stalling — long-running is
self-stated at the hour, not discovered after the fact.

The per-state forms:

- Working and Continue carry the full set: done; ongoing;
  computed locally while a full-capacity venue is up;
  serial work that should be parallel; stalling, and why,
  and what would speed it up; duplicate-intent
  consolidation; docs state.
- Blocked-owner and Blocked-hard carry done-so-far plus
  the blocker: the blocked item, why, the exact clearing
  act, and whose it is.
- Review carries done with its gate evidence, docs state,
  and what awaits the decision.
- Done carries done, docs state, and the tail — one line
  per item with its owner: self (closeout the thread
  clears itself) or owner-decision (offered follow-ups
  awaiting accept, reject, or modify).
- Closed carries done as one summary line plus docs state.
- Parked carries done-so-far, why parked, and what resumes
  it.

The thread states are eight. Working: a work item is in
progress. Done: all work items done, with closeout or a
tail remaining. Closed: closeout landed and the tail
empty — done answers the work question, closed the
supervision question, and a closed report carrying a tail
item is a contradiction. Parked: deliberately paused by
instruction; it never reads as stalling. Blocked-owner:
the critical path sits in blocked work only the owner can
clear. Blocked-hard: the critical path sits in blocked
work a hard stop clears. Review: finished work presented
for accept, reject, or modify. Continue: agent-clearable
work remains and proceeds without a go.

The item kinds are three. A defect is a diagnosed defect
in built work, implemented without approval once
diagnosed. A follow-up is a post-plan improvement — held
at the owner's tap, built in a worktree — or a defect-fix
suggestion, which merges on a green gate. A question is a
decision handed to the owner.

A signal matches exactly or not at all; absence of a
signal never reads as completion; an unrecognized status
escalates to judgment rather than being guessed. A thread
with work outstanding and no signal on record gets a
status request, and repeats require new knowledge, never
just elapsed time. An offer exists only as a posted item:
a follow-up, improvement, or consolidation proposed in
prose alone does not exist, and a prose-only offer is a
reporting defect.

## Hard-stop floor

**Inline class — the floor is not declarable.** Permission
cards, scope expansions, logins, external sends,
purchases, sensitive form submits, real-calendar writes,
and schedule changes never auto-apply in any presence. No
declarable rule may name one — such a rule is refused at
posting; their only rule-side form is a shadow proposal;
and approve-once, deny, and push are never rule-eligible.

A permission card is a registered hard-stop wait class,
and a lane a card blocks posts its own wait for it. A card
that blocks no watching lane has no self-poster under this
shape — a named, open residue, not a silent gap.

## Auto-rules

**Shadow-first discipline.** Any action may be promoted to
an automatic rule by a deliberate promotion act, and every
such promotion lands in shadow — evaluated and reported,
never fired — the one exception being the approval of a
wait, which lands active. The seed patterns below start in
shadow together.

The seed patterns (the evaluated rule records themselves
stay engine data):

- A defect item clears when its subject reaches a terminal
  state.
- A stale status draws a status request.
- A performance clearance is served as for-information,
  not as a decision.
- A done report that conflicts with the work record's
  derivation returns to its lane; the trigger reads that
  derivation at evaluation time.
- A done report on a user-interface-surface handler
  dispatches a critic commission; the surface mark is a
  flag on the handler registration.
- A completion proposes a consolidation pass; the trigger
  reads the work record's derivation at evaluation time.

## Code and documentation patterns

No backward-compatibility shims and no barrel re-exports:
never create alias modules or forwarding functions when
moving code — update all call sites instead. Package init
files carry no re-exports (docstrings, version, and true
dynamic registries excepted); consumers import from the
leaf module.

Resource budgets are derived, never hardcoded: worker
counts and memory limits are sized from measured
availability on the machine the work runs on — host and
container-limit signals, with a safety fraction — by a
resource-derivation function, and hardcoded thread or
memory limits in library and pipeline code are
scanner-blocked. The derivation function's name is the
adopting repo's binding.

Settings are a modular registry under one environment
seam: providers register per domain or phase — no
monolithic configuration class; dotted paths map
deterministically to environment names; direct environment
access outside the seam module is scanner-banned;
secret-marked settings are stripped before anything is
persisted; precedence runs command-line over environment,
and stored configuration over defaults. The seam module
and provider paths are the adopting repo's binding.

Every package README carries a Purpose section, a
Contracts list of bolded invariants, and a Deliberate gaps
list — neither as a table. It states intent rather than
specifics: counts, versions, and defaults live in the code
that owns them. It cites only paths that exist in the
repository, and it documents verified behavior — planned
work is recorded as a gap, never described as working. If
a section can be autogenerated, it is dropped.

Comments and docstrings default to none: prose earns its
place only by stating what the code cannot. Hard caps
apply per prose kind (module, function, comment block;
tighter for tests), exceedable only for a precondition the
type system cannot express; the caps' values are owned by
the bindings layer, and enforcement is by the prose-length
scanner. Prose documents intent, not execution, and serves
six justifying categories: a non-obvious invariant, a
refusal semantic, an ordering or atomicity constraint, a
caller obligation, a safety or integrity rule, an
inexpressible precondition. Never narration, measured
figures, project vocabulary, or a restated rule. Changing
code does not license growing its prose.

Fixture discipline: default unit tests are offline,
deterministic, and fast. Committed fixtures are sanitized,
minimal golden references. Data a production module
consumes is not a fixture and lives beside its owning
module in the package. Generated test outputs use
transient paths, never the repository tree.

Test-tree mirroring: the test tree mirrors the source tree
package for package, so a test file sits at the same
relative path as the module it covers — one test file per
source module — and shared setup lives in a conftest at
the narrowest directory that needs it.
