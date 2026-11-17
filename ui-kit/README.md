# Starter UI Kit

The generic design system for new UI projects in the spec-driven starter:
tokens, a deterministic generator, the primitives that spend them, and
the contrast gate that prices them. It is distilled from the two project kits
that proved the patterns in production — the Workhorse Kit in this repo and
Steam Power's `@steampower/ui` — but carries neither project's palettes,
status table, prefix, or components. What crossed is the machinery and the
failure-mode coverage. It is built under the starter's generic
UI kit programme plan, which lives in this repo's plans folder.

## Getting the kit

The webapp flavor seeds the kit into a new project as a copied package
the project owns: applying the flavor (`python3 tools/apply_flavor.py
webapp`) places it at `packages/ui-kit/`, and the flavor's composed
check (`tools/check.mjs`) runs its legs — token-regeneration
byte-identity, the contrast gate, and the kit's own typecheck. In this
repo the kit lives at `ui-kit/` and is exercised directly with the
command sequence under "The gate" below.

## Contents

- `tokens/tokens.json` — the single source of truth (DTCG). One-way tiers:
  - `primitive` — two neutral seed palettes (`slate`, `sage`, each a
    50–900 scale), a neutral `gray` scale, `white`/`black`, and the
    space / radius / font / font-size / line-height / motion scales.
  - `semantic` — per palette × light/dark: surfaces (`canvas`, `1`, `2`,
    `3`, `sunken`), content (`primary`, `secondary`, `muted`), borders
    (`default`, `strong`), **`field-border` as its own role** (the control
    boundary; never the decorative hairline), **`focus` as its own role**
    (never an accent alias), `accent` / `accent-hover` / `on-accent` /
    `accent-soft`, `danger`, `notify` / `on-notify`, `unknown`, `highlight`
    (selection/annotation fills and bars), `shadow-overlay`.
  - `status` — a small generic set (`ok`, `info`, `warn`, `fail`, `stale`,
    `idle`); each status's `hue` (graphical) is a separate token from its
    per-mode `text` value, so a hue is never spent as text unpriced.
  - `component` — button, card, chip, row, panel, and layout tokens that
    reference the tiers above.
  - `density` — `comfortable` / `compact` value sets that re-point the
    component names; density never renames a variable.
- `tools/gen-tokens.mjs` — the one generator (node, no dependencies):
  `tokens.json` → `themes/`. The CSS prefix `--ui-` lives in exactly one
  place, the generator's `varName()` naming map.
- `themes/` — the generated CSS distribution (`index.css` plus one file
  per palette). Generated, checked in, **never edited by hand**;
  byte-identical regeneration is the drift proof.
- `tools/verify-contrast.mjs` — the contrast gate (below).
- `components/` — the primitives (fields, grouped list, checkbox/radio,
  toggle, segmented control, button, card, badge, status chip, sheet,
  empty state, app shell), spending only kit tokens, plus `Specimen` —
  the review harness rendering every primitive in its contracted
  variants in both palettes × both modes; it is the first surface the
  rendered legs (`docs/checks.md`) run over.
- `lib/responsive.ts` — the one breakpoint seam every shell switches on.

## The gate

One documented sequence builds and gates the kit from a fresh copy:

```sh
cd ui-kit
npm install                       # the kit's devDependencies (typecheck)
node tools/gen-tokens.mjs         # themes regenerate byte-identically
node tools/verify-contrast.mjs    # the contrast gate: fatal, counts printed
npm run typecheck                 # tsc --noEmit over components + lib
```

The contrast gate auto-enumerates its pairs from `tokens.json` (never a
hand-listed pair set) and exits 1 on any failure: status and content
text on surfaces (4.5:1, muted at the same bar), text on tints and on
solids, focus and control boundaries (3:1, with a spend census over the
components and themes classifying every outline suppression and border
spend), and component mix states at their worst case. Component
constants that change a rendered pairing are mirrored as data in the
gate; a component that changes its constant owes the gate the same
change, in the same change.

## Re-seeding a palette

The seed values are neutral and provisional-but-gated: they were chosen on
the palettes' own scales to clear the bars the contrast gate prices
(content and status text 4.5:1 on every surface; field-border 3:1 on
control grounds). A consuming project re-seeds in a design pass: replace
the primitive scales and the semantic literals that do not alias them,
keep the tier shape and every role name, and let the contrast gate
price the result. A role with one mode or one palette filled is an
incomplete token, not a default.

## Fonts

The seed bundles **no font files**: the `font` tokens reference system
stacks, and that is the settled form for the generic kit. A project
that needs a bundled face adds local `@font-face` files under its own
design pass (the Workhorse Kit's form: local files only); no external
font fetch is permitted at any step.

## Rules the kit is built under

- No token is spent in a role it was not priced for: a hue spent as text,
  a decorative hairline spent as a control boundary, and an accent spent
  as a focus indicator are each defects the gate or a spend census must
  be able to name.
- Component constants that change a rendered pairing (color-mix
  percentages, tint strengths, gradient stops) are mirrored as data in
  the contrast gate; a component that changes its constant owes the gate
  the same change, in the same change.
- Adding a look is a token-file change. If a new look requires editing
  consumers, that is a defect against the kit.
