# Starter UI Kit

The generic design system for new UI projects in the spec-driven starter:
tokens, a deterministic generator, and (from Step 4 of the governing plan)
the primitives that spend them. It is distilled from the two project kits
that proved the patterns in production — the Workhorse Kit in this repo and
Steam Power's `@steampower/ui` — but carries neither project's palettes,
status table, prefix, or components. What crossed is the machinery and the
failure-mode coverage. It is built under the starter's generic
UI kit programme plan, which lives in this repo's plans folder.

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

## Re-seeding a palette

The seed values are neutral and provisional-but-gated: they were chosen on
the palettes' own scales to clear the bars the contrast gate will price
(content and status text 4.5:1 on every surface; field-border 3:1 on
control grounds). A consuming project re-seeds in a design pass: replace
the primitive scales and the semantic literals that do not alias them,
keep the tier shape and every role name, and let the contrast gate
(Step 3 of the governing plan) price the result. A role with one mode or
one palette filled is an incomplete token, not a default.

## Fonts

The seed bundles **no font files**: the `font` tokens reference system
stacks. Bundling local font files (the Workhorse Kit's form: local
`@font-face` only, no external fetch, ever) is a Step 4 concern, decided
with the primitives; no external font fetch is permitted at any step.

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
