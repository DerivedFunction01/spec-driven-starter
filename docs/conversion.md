# Conversion mode

A conversion replaces a working system; a greenfield build
starts from nothing. The difference is the proof burden: a
conversion must show it preserved behavior, not merely that it
works. This track adds that machinery. Everything else in the
starter applies unchanged.

## Mode declaration

A project declares its mode in `SPEC.md`:

```text
Mode: greenfield | conversion
```

Greenfield is the default. Conversion adds this track: no
application code before characterization (below) is complete
and the track gates are ruled.

## Conversion intake

Characterization (below) establishes what the predecessor
*does*; the intake establishes what the successor is *for*.
Before the spec extraction, the conversion runs the same
intake as a greenfield project (the pre-build conversation in
`docs/method.md`), with three conversion-specific rules:

- The **audience-and-persistence declaration** is re-asked,
  never inherited: a successor whose audience or persistence
  differs from the predecessor's says so as a change ruling.
- Every **conditional question** is asked against the
  predecessor's observed behavior — a capability the
  predecessor has is evidence the trigger is in play, and a
  no answer for it is a drop ruling in the extraction, not a
  silent omission.
- Inspiration pins (the pin-board template) refresh at
  intake: pins the predecessor's era produced are re-ruled
  or dropped before the successor's surfaces are designed.

Answers are recorded in the dossier and cited by the spec
extraction; a yes creates the same conditional sections and
templates it creates in a greenfield project.

## Characterize before touching

Before any change, inventory the predecessor as it runs:

- **Entry points** — commands, servers, scheduled invocations,
  and manual procedures that start work.
- **Data stores and state** — files, databases, caches, and
  the state only a running process holds.
- **External seams** — integrations, credentials' locations,
  network dependencies, other people's systems.
- **Generated artifacts** — anything the system produces that
  something else consumes.
- **Automated behavior** — schedules, watchers, retries, and
  anything that acts without being asked.

Record observed behavior in a characterization dossier
(template: `docs/characterization-template.md`). Before any
change, capture golden fixtures from the *running* predecessor
— outputs, files, rendered artifacts. The fixtures are the
parity baseline; a fixture captured after the fact proves
nothing.

## Catalogue, don't rediscover

Every diagnosed failure mode of the predecessor is ported into
the dossier with its root cause. In the spec extraction, each
behavior gets a ruling:

- **keep** — the successor reproduces it;
- **change** — the successor differs, deliberately;
- **drop** — the successor omits it, deliberately.

Change and drop are rulings with reasons, never side effects of
the rebuild. The successor designs around known defects instead
of inheriting them or paying to diagnose them a second time.
An undiagnosed predecessor quirk is an open question in the
dossier, not a surprise scheduled for later.

## Intent checklist

Keep / change / drop rules on *behavior*; the successor is
also judged against the predecessor's *intent*, mined from its
history (its plans, its records, its ruled questions) and
checked row by row in the dossier's intent table:

- **improvement** — the successor does the intended thing
  better, and says how;
- **missing** — the intent is real and the successor does not
  carry it yet: a finding with a price, not a shrug;
- **not-implemented** — the intent was never built in the
  predecessor either; it is ruled on its merits, not inherited
  as backlog.

Absence in the original is not an excuse: an intent the
predecessor expressed and failed to build is still intent.
Dead features split into *abandoned* (the intent was given up,
on evidence) versus *attempted-but-failed* (the intent stands;
the attempt is a failure mode for the catalogue). An intent
the history implies but never expresses requires a gesture —
a question to the owner — before the successor rules on it.

## Failure-mode census verdicts

Every mode in the dossier's failure-mode catalogue carries a
coverage verdict in the successor: **covered**, **partial**,
**missing**, **not applicable**, or **unproven** — each with
its supporting file or record. A partial is a finding priced
as its own work order, never counted as coverage. Each ported
mode carries a regression test that fails against the unported
behavior; its detection signals are carried in full (every
place the signal can appear, not the one place it was seen);
and the port is proven once against live behavior, not only
against a fixture.

## Spec extraction

The `Source` section of `SPEC.md` names the predecessor as the
oracle (method move 1). Observed behavior wins over the
predecessor's documents; where they disagree, the extraction
says so at the disagreement, citing the observation. The
dossier is the evidence the spec files cite.

## Parity is the proof burden

Each implementation step verifies result preservation against
the golden fixtures: byte-identical, or every diff enumerated
and explained. A deliberate behavior change lands only with its
spec amendment in the same change, citing its change ruling
from the extraction. In conversion mode the gate staying green
is necessary, not sufficient — a green gate with an unexplained
fixture diff is a failed step.

Fixture discipline:

- Tracked fixtures are fictional or scrubbed captures; real
  captures stay untracked instance state.
- A fixture that cannot be reproduced from the predecessor is
  marked as such in the capture log, with the reason — never
  quietly replaced by a hand-made stand-in.

## Instance-state separation

The predecessor's real data, configuration, and personal
literals never enter the tracked tree. They are preserved as
untracked instance state, inventoried before the swap. The
tracked tree carries a sample authored as fiction. At
conversion time the denylist (`docs/checks.md`) is provisioned
from the predecessor's personal literals, so the gate fails if
one ever reaches a tracked file.

## Swap protocol

The predecessor stays runnable until the successor's gate is
green *and* parity is proven. Then:

1. Take a safety bundle of the predecessor repository.
2. Write a checksum manifest of every preserved instance file.
3. Swap the successor in place.
4. Verify every preserved file byte-identical against the
   manifest.

Rollback is restoring the bundle. Nothing is deleted at swap
time; archiving or retiring the predecessor afterward is a
separate, later ruling, made when the successor has carried
real work.
