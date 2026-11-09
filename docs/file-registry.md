# File registry

The full text of the file-registry contract stamped in
`SPEC.md` (`file-registry: v1`): the manifest format, the
check contract, and the seed-list decision. The contract
in one line: after a restart, a checker walks a registry
of must-exist files, restores the ones with a restore
source, and flags the rest to their owners — so a loss is
reported at the restart that reveals it, by the file's
own name, instead of surfacing late and sideways in
whatever downstream reader trips over the absence first.

## The manifest

A registry is one YAML file. The format is tracked (this
document and the specimen in `examples/registry/`); the
live manifest is untracked data, seeded from the specimen
and filled in per deployment — the tracked-example /
untracked-live split the rest of the kit uses. Adding an
entry never changes any checker.

```yaml
roots:
  workspace: <absolute path of the workspace root>
  kit-repo: <absolute path of a repo checkout>

files:
  - path: <path relative to the root, or a glob>
    root: workspace
    presence: non-empty
    restore:
      class: backup
      backup: <path the file is copied back from>
    owner: <thread or workhorse that gets the flag>
```

Each entry carries:

- **path** — a file path relative to its root anchor,
  or a glob. Root anchors are declared once in the
  manifest's `roots:` map, so an entry never repeats a
  machine-specific prefix and the same registry shape
  parses on any host.
- **presence** — the rule the file must satisfy:
  `exists` (a file is there), `non-empty` (there, and
  larger than zero bytes), or `sha256` (there, and its
  digest equals the entry's `sha256:` value). Digests
  are data in the live manifest, never constants in a
  checker.
- **restore** — the class and its source, one of:
  - `tracked` — restored from its repo; the entry names
    the repo root anchor, and the file's path in the
    repo is its registry path.
  - `generated` — restored by re-running the declared
    generator; the entry names the command and its
    working root.
  - `backup` — restored by copying the declared backup
    path back. A backup that itself fails presence is
    a flag, never a silent chain to a further source.
  - `flag-only` — no source; the entry carries no
    restore fields, and the checker never writes
    anything for it.
- **owner** — the thread or workhorse a flag for this
  entry is delivered to. An entry without an owner
  cannot be flagged, so the field is required.
- **optional** — optional boolean, default false. An
  optional glob entry may match nothing; a non-optional
  glob matching nothing fails, and every matched file
  must satisfy the presence rule.

## The check contract

- **Trigger.** Restart detection is the primary trigger:
  the pass runs when the host's boot identity changes.
  An interval pass and a manual pass are permitted and
  are the same code path with the same verdicts.
- **Walk.** Each entry is evaluated exactly: missing
  fails every presence rule; zero bytes fails
  `non-empty` and `sha256`; a digest mismatch fails
  `sha256`. There is no partial credit and no
  "close enough" state — a truncated file is a failed
  file.
- **Restore.** A failed entry with a restore class is
  restored automatically, from its declared source
  only. The restored file is re-checked against the
  presence rule; a restore that does not satisfy the
  rule is reported as flagged, not restored.
- **Flag.** A failed entry that cannot be restored —
  flag-only class, a failed restore, or a restore
  source that itself fails — is reported to the
  entry's owner with the reason. The checker invents
  no content, ever: an unrestorable file is a report,
  not a writing prompt.
- **Report.** One report per pass, findings first:
  every flagged entry with its reason, every restored
  entry with its class, and the count of entries that
  passed. A pass with nothing to report files no
  report.

## Scope: one contract, three workhorses

The registry format is a shared contract because three
workhorses hold must-exist files: the scheduler (its
registry and job state), the workspace harness (its
tracking and viewer state), and the session venue (its
lease and run records). Each workhorse runs a conforming
checker over the registries anchored in its own domain
when its own restart detection fires; the format is one,
so an entry means the same thing to every checker that
reads it. Building a checker is commissioned per
workhorse against this contract; the contract lands
first, and no checker extends the format — a needed
extension amends `SPEC.md` and bumps the version.

## Open decision: the seed list

Which files are critical enough to register first is
**not decided by this document**. It is a named decision
for the owner, taken when the first checker is
commissioned, under this admission rule: a file earns
registration when its absence or truncation has broken
work, or would surface late enough to cost more than
the registration. Candidates named as examples — not a
list in force:

- The workbench's todo files, whose truncation has
  already read as invalid downstream.
- The caller registry a venue's wrappers resolve
  attribution against.
- The venue's lease and run records, which its recovery
  ladders read as truth.
- The viewers' persisted state, which their watchdogs
  and restore paths assume.

The decision records the chosen entries in the first
live manifest; this document keeps only the rule and
the candidates.
