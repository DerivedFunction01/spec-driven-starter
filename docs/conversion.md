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
