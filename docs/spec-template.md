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

## Intake record
<The answers the pre-build conversation (greenfield) or the
conversion intake produced, recorded once and cited by the
files they activate. The audience-and-persistence declaration:
who uses the app, whether their entries are saved, whether it
needs a public link, a custom domain, or a team, and the
hosting shape ruled from those answers. Persistence: one line
per store the project keeps, naming its class — regenerable
(state rebuilds from source; no migration machinery, by
decision), local-durable (one machine; versioned local
transforms), or shared-production (live data; the migration
policy in full). Then one row per conditional question asked:
| Question | Answer | Scope | Activates |
| --- | --- | --- | --- |
| <the conditional question> | <yes / no> | <where it applies> | <the section, template, or primitive a yes created> |
A conditional section exists in this spec only where a row
above answers yes; a no leaves no trace — no section, no
placeholder.>

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
A spec section takes effect when it is adopted by a dated
ruling; before that it is a draft, and a wish feeding it is
recorded as a wish, not as settled text. Questions the
ruling leaves open go in the register of open decisions —
a short list in the spec index naming each question and its
owner — and wait there rather than being assumed away.
Amend the small file that owns the section. Keep section
numbering stable. Date the amendment and cite its ruling or
evidence. A behavior change amends the spec in the same change
that implements it. A contract change amends the seam document
under its own versioning, never a spec file alone. Material
that outgrows a file (past the gate's length cap) gets its own file and a map
row; it does not inflate a neighbor.
```

## Per-file discipline

- One topic per file; the heading set is the table of contents.
- Every normative claim traces to evidence (a source file, an
  observation, a ruling) cited inline.
- Known defects and stubs of any predecessor get their own
  section, owned by the track that will fix them, with pointers
  from the other track — never silently dropped.

## Frontend surface specs: the state matrix

Every frontend surface spec carries a state matrix — one row
per state, stating what renders:

| State | Renders |
| --- | --- |
| populated | <the surface with its data> |
| empty | <the honest-absence rendering: what is said when there is nothing> |
| loading | <per portion — each portion loads when it can; never one global state hiding the whole surface> |
| error | <what the reader is told, in plain words; last-good data where the contract keeps it> |
| partial | <some portions present, some absent — and how absence is marked> |

The matrix is part of the track gate: a surface with an
unspecified state is an incomplete spec. The visual check
exercises the main flow in each state at the relevant screen
sizes.

## Register (when the intake records non- or beginner coders)

Reader-facing material — questions, status reports, studies,
summaries — is written in two registers in one document: a
plain-language lead stating the decision, the outcome, and
what it means for the reader, with every technical term
explained at first use from the project's glossary; then the
exact technical record (identifiers, contracts, commands),
untranslated and unabridged. Plain is a translation of the
substance, never a reduction of it: the same decision must be
recoverable from either register.
