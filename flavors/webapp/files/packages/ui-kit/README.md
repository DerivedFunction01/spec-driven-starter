# UI Kit

The one shared design system in the spec-driven starter, for
every consumer. This directory is the kit's home: the kit is
built once here; repos consume it, they never fork or copy it.

## Contents

Consumers depend on this home as the package `@starter/ui-kit`
(`package.json`, this directory).

- `tokens/tokens.json` — the single source of truth (DTCG):
  primitive → semantic → component tiers (one-way), the status
  table (14 named statuses with hue, per-mode text, glyph,
  description), both palettes (olive, teal) × both modes, and
  the density sets.
- `tools/gen-tokens.mjs` — the one generator (see below).
- `tools/verify-contrast.mjs` — the contrast gate: every status
  text and essential-content token against every surface, both
  palettes × both modes, read from `tokens/tokens.json`.
- `themes/` — the generated CSS distribution (`index.css`,
  `fonts.css`, `olive.css`, `teal.css`): the `--ui-*` variables
  every consumer renders with. Generated, checked in, never
  edited by hand.
- `assets/fonts/` — the bundled woff2 the generated `fonts.css`
  references (Inter variable; IBM Plex Mono 400/500/600), via
  local `@font-face` only — no external fetch, ever; plus
  `assets/fonts/katex/` — KaTeX's 20 woff2 (see `Math`, below).
- `components/` — the 24 viewer primitives (Badge, Button, Card,
  Chip, DataTable, Lane, Sheet, TriageRow, SegmentedControl,
  Toggle, Tooltip, …): 24 named components in 23 files —
  `Fields.tsx` carries three (Select, Input, Field). Also
  carried: `Specimen.tsx`, the specimen harness that renders
  every primitive in its contracted variants (a review surface,
  not itself a primitive).
- `components/shell/AppShell.tsx` — the one app shell (contract 09):
  `AppShell` switches between its two
  presentations on the `lib/responsive.ts` seam — `SidebarNav`
  + `TopBar` on desktop, `PhoneShell` (large-title nav,
  grouped-list section index) on phone. Every app renders
  inside it; no app keeps a shell of its own.
- `components/display/GroupedList.tsx` — the iOS form family (kit gap
  K1, closed): `GroupedList` (the inset grouped
  list; hairline dividers between any children), `GroupLabel`,
  `Row` (structured: label / sub / badge / end / chevron,
  under the owner's two-line row discipline — the label's
  line is its own, the `badge` slot is the entity form's
  flex-none line-1 badge, `end` rides the details line),
  `StatRow` (label/value facts), `SwitchRow` (a labelled row
  over the kit `Toggle`), `RadioRow` (the checkmark option
  row), `NoticeRow` (the banner as a row above the groups;
  warn and fail tones), and `ActionRow` (full-width action,
  danger variant). The four apps composed this family
  locally in four dialects; this file is the one form.
- `components/display/StatusChip.tsx` — the outcome chip (K1):
  `StatusChip` renders a tone + label on the contract 06
  tone mapping (ok / info / warn / fail on the status
  table's hue + text variables, idle sunken), in a plain
  and a pressable form. Not `Chip`, which renders the
  ruled-status table only.
- `components/controls/Checkbox.tsx` — the selection controls (K1):
  `Checkbox`, a CIRCLE whose box is locked (width, height,
  min and max pinned, flex 0 0 auto, align-self set), so no
  parent row height and no global button rule can stretch
  it into an ellipse (the owner's tick lesson);
  and `Radio`, the standalone round radio control with the
  same lock. `RadioRow` (in GroupedList.tsx) is the
  full-width checkmark form.
- `components/display/LogRow.tsx` — the one timeline / log-entry row
  (the kit sheet's LogRow), redesigned in the
  timeline-component study, Variant B as picked by the owner:
  `LogRow` renders one served entry (date token in a fixed
  column, headline, kind badge at the right end — flex-none,
  never clips — and a time-led meta line), and `LogRowDrawer`
  is its entry drawer (full message, served facts, optional
  entity routing row). A pure form-model: kinds, tones, and
  facts arrive as data; no per-app knowledge. First consumer:
  the runner's Events view.
- `components/shell/Math.tsx` — `Math`, the typeset-math component
  (the math-component study, approved): renders
  one served math node — structured segments carry math
  nodes as `{source, display, valid}` — with KaTeX 0.16.11.
  Inline it sets in prose and inherits the content colour,
  light and dark; display it sits in the sunken well, with
  the equation number as a content slot (children — document
  content, never a component counter). Validity is a served
  state: an invalid node renders the study's frame-5
  fallback (raw source — mono chip inline, mono block with
  the vermilion left bar in display), with KaTeX's
  `throwOnError: false` kept only as a render guard. Each
  typeset node carries its TeX source as its accessible
  name; KaTeX's MathML output stays enabled. The overflow
  rule is the owner's pick (frame 4a): a wide display
  equation scrolls horizontally in its well at full typeset
  size, never scaled down (frame 4b, shrink-to-fit, was
  rejected). KaTeX's assets are vendored in this home —
  `assets/katex-fonts.css`, `assets/katex.css`,
  `assets/katex-sizing.css` and `assets/katex-symbols.css`
  (woff2-only) and its 20 woff2 fonts in
  `assets/fonts/katex/` — and imported
  by the component itself,
  never through `themes/`; TS consumers also take
  `@types/katex`.
- `lib/responsive.ts` — the primitives' one external dependency
  (the `useIsPhone` viewport hook), carried so the component set
  is self-contained; it imports only React.

## The one generator

```
bun tools/gen-tokens.mjs        # from this directory
bun tools/verify-contrast.mjs   # the contrast gate
```

`gen-tokens.mjs` reads `tokens/tokens.json` and regenerates
`themes/` deterministically: same tokens in, byte-identical CSS
out (no timestamps). At extraction, regeneration from this home
reproduced the workbench's pinned checked-in CSS byte-for-byte,
and the contrast gate passed both palettes × both modes
(280 status-text/surface pairs, 60 content/surface pairs,
0 failures).

## Consumption rule

Consumers take the generated CSS in `themes/` as a checked-in
distribution from this home (vendored with provenance); they do
not regenerate it, and no second generator exists in any
language — one generator, here, full stop (plan §10.4). A new
look is a few file edits in this home's token/theme files,
never edits across consumers; needing to touch consumers is a
defect against the kit. A surface needing more extends the kit
once, here, and every consumer inherits the extension.
Form only: the kit carries look and movement; each repo's
served shapes and behaviors stay its own.

Two consumption rules cost each early consumer a debugging
round; both are standing:

- **The `@source` rule (alias consumers).** A consumer that
  imports components through the `@starter/ui-kit` alias must
  give Tailwind `@source` lines for the kit's `components/`
  and `lib/` in its own CSS entry. Without them, utilities
  used only inside kit components silently never generate —
  the app builds green and renders unstyled chrome (measured
  at the shell unification: 38,347 B / 198 classes without
  the lines, 44,179 B / 269 with them). Every integration
  gate asserts the built CSS contains the AppShell sidebar
  utilities.
- **The AppShell composition rule.** Views that self-pad
  compose the kit's exported `SidebarNav` + `TopBar` with an
  unpadded content column; views that don't self-pad take
  `AppShell` whole (its frame insets the content for them).
  Mixing the two — AppShell's frame around self-padding
  views — double-insets every surface.

The themes bundle is self-contained: `themes/index.css`
imports only files the kit ships (fonts + one CSS per
palette). Gap K2 (closed): an earlier generated
`index.css` imported a `katex.css` the kit has never
carried — a workbench-viewer asset vendored by hand beside
that repo's themes — which forced consumers to stub the
file or skip `index.css` entirely. The import stays
removed: `themes/` carries no KaTeX reference. The kit's
math component (above) vendors KaTeX
under `assets/` and imports it from the component itself —
the dangling-reference failure this gap names does not
return by that door either. Gap K3 (closed): `--ui-accent-soft`
is a semantic token (the accent at resting-fill alpha,
both palettes × both modes); consumers no longer fall
back for it.
