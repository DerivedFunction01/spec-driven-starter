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
