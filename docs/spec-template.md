# SPEC template

Copy this shape for a new project. `SPEC.md` at the repo root is
an index only: a map of the small files under `spec/`, the rules
for reading and amending them, and their provenance. It carries
no normative content of its own.

## Index skeleton

```text
# SPEC — <project> (index)

Mode: greenfield | conversion

## Source and oracle
<What the spec was extracted or written from, with citations.
Where a source document and observed behavior disagree, which
wins, and that the extraction said so.>
<Conversion only: name the predecessor and state the oracle
rule — its observed behavior is the evidence; where its
documents disagree with observation, observation wins and the
extraction says so. Point at the characterization dossier
(docs/characterization-template.md) and at the keep / change /
drop table's location: every predecessor behavior carries one
of those rulings, with reasons for change and drop.>

## Layout and gates
<Tracks, their file sets, the one seam contract, and each
track's gate: who rules, and that no application code precedes
its track's gate.>

## File map
| File | Contents |
| --- | --- |
| spec/backend/00-product-summary.md | product summary |
| spec/backend/01-features.md | feature inventory |
| spec/frontend/01-features.md | feature and flow inventory |

## Provenance
<When, from what, at which revision; how later changes to the
source arrive (dated delta files, never silent rewrites).>

## Amending
Amend the small file that owns the section. Keep section
numbering stable. Date the amendment and cite its ruling or
evidence. A behavior change amends the spec in the same change
that implements it. A contract change amends the seam document
under its own versioning, never a spec file alone. Material
that outgrows a file (~800 lines) gets its own file and a map
row; it does not inflate a neighbor.
```

## Per-file discipline

- One topic per file; the heading set is the table of contents.
- Every normative claim traces to evidence (a source file, an
  observation, a ruling) cited inline.
- Known defects and stubs of any predecessor get their own
  section, owned by the track that will fix them, with pointers
  from the other track — never silently dropped.
