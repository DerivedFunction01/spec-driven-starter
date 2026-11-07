# Fundamentals template

Each track keeps one fundamentals document. Copy this skeleton;
keep the sections, replace the content with the track's own
rules and the evidence each rule answers.

```text
# Fundamentals — <track>

## Why it looks like this
<The predecessor or problem evidence. Each rule below names the
failure it answers; a rule whose warrant is forgotten is a
candidate for removal, not a tradition.>

## Organizing principle
<Group by intent inside layer tiers. State what grouping is
prohibited and why.>

## The tree
<The track's folders, one line each: what lives there and what
it may touch. A file's folder is its stereotype.>

## Import / dependency rule
<The explicit matrix or ordering. Downward only, acyclic,
imports from the leaf module, no reexports.>

## Seams
<The settings seam, the contract seam, and any store or
transport seam: the one module allowed to do the thing, and how
everything else receives values instead.>

## Conventions
<Naming, error handling, testing (tests read tracked content
only), and the file-size cap the gate enforces.>

## Wishes and specs
<The doctrine, in this project's words: a wish states an
outcome without rules and nothing builds from one; a spec
states rules, constraints, edge cases, and failure paths and
is adopted by a dated ruling; a provisional default is not a
ruling; undecided questions wait in the spec's register of
open decisions. This section is never dropped in a generated
fundamentals — it is how a later owner, coder or not, learns
the rule from the repo itself.>
```
