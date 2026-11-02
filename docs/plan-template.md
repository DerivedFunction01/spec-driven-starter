# Plan template

Plans live in the plans directory named by `workbench.yaml`,
one file per plan, named with a date prefix and a slug. Copy
this skeleton.

```text
# <Title>

Status: draft

## Objective
<One paragraph: the outcome, not the activity.>

## Rulings
- <Each settled decision the implementation must honor, with
  its date and source. Rulings bind; a step that contradicts
  one stops and surfaces instead of improvising.>

## Steps

### Step 1 — <name>
<What is built or changed, in the codebase's own terms.>
files: <the files touched>
verify: <the command or check whose result proves the step>
done when: <the observable end state>

## Open questions
- [ ] <A question only the owner can rule on>
  Recommendation: <the recommended answer, with its price>
  <!-- wb-question
  id=<slug>
  type=choice
  options=<a> | <b>
  recommended=<a>
  answer=
  -->

## Critical files
- <file> — <why it matters to this plan>
```

## Conversion mode (skip when `Mode: greenfield`)

A conversion plan opens with a preamble block, before Step 1:

```text
## Conversion preamble
Predecessor: <name and revision>
Dossier: <characterization dossier location>
Keep / change / drop: <table location in the spec extraction>
```

- **Step 0 is characterization**: the dossier is complete and
  the golden fixtures are captured from the running
  predecessor. Step 0 gates every later step — no other step
  starts until it is done.
- Each step's `verify:` names its parity evidence in addition
  to the gate: the fixture diff result (byte-identical, or the
  diffs enumerated and explained). A deliberate behavior change
  cites its change ruling and lands with its spec amendment in
  the same change.
- The final step is the swap (`docs/conversion.md`): safety
  bundle taken, checksum manifest written, swap in place,
  preserved files verified byte-identical against the manifest.

## Working a plan

- Create one todo per step through the project's todo harness
  *before* starting; move each at its transition
  (todo -> doing -> done / blocked). A blocked step is marked
  blocked with the reason the moment it blocks.
- Arming a step carries a status-update interval (15 minutes
  for delegated or fast-moving work, 30 otherwise, never
  longer): it checks the work and surfaces milestones, stalls,
  blockers, and completion only.
- Verify means run it: each step's `verify:` is executed and
  its result recorded, not asserted.

## Closeout

In the same pass that lands the last step: set the plan's
`Status:` to `complete` (or `superseded`), and move the file to
the finished archive under the plans directory. Work beyond
the plan's scope becomes a followup plan carrying only the
remainder; the landed plan archives naming the followup. A
completed plan is never edited again — later verification and
deployment ride its todo files.
