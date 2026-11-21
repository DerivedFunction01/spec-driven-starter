# UI context token file — template

> **Superseded for kit projects.** A project carrying the
> starter UI kit (`ui-kit/`, seeded by the webapp flavor as
> `packages/ui-kit`) does not fill in this template: the
> kit's `tokens/tokens.json` is this file's seeded form —
> the same roles, filled, tiered, and priced by the kit's
> contrast gate — and the project's design pass re-seeds
> the kit's palette instead (see `ui-kit/README.md`). This
> template remains the form for projects that do not carry
> the kit.

The design context a UI project seeds *before* features, so no
feature invents visual values (the failure this prevents: a
fixed per-theme value — a dark footer under a light theme —
discovered after build). One token file per project, kept with
the frontend spec and cited by components; styling is
token-only (the web-stack standards). Copy this skeleton.

```text
# UI tokens — <project>

## Color roles (per theme)
| Token | Role | Light | Dark |
| --- | --- | --- | --- |
| --surface | page background | <value> | <value> |
| --ink | primary text | <value> | <value> |
| --accent | interactive / brand | <value> | <value> |
<Every role the UI uses, both themes in one row: a role with
one theme filled is an incomplete token, not a default.>

## Typography
| Token | Use | Value |
| --- | --- | --- |
| --font-ui | interface text | <family stack> |
| --text-base | body size / line height | <value> |

## Radius and spacing scales
<The named steps (sm / md / lg), never per-component numbers.>

## Component library
<The library in use (or hand-rolled primitives), its version,
and the rule for when a project primitive replaces a library
component.>

## Layout patterns
<The recurring layouts (list/detail, form page, dashboard
grid) named once, with their grid and breakpoint behavior.>

## Icons
<The icon set, its license, the size grid, and the rule that
icons are assets — manifest-referenced like any imagery.>
```

## Seeding the palette

The palette is seeded in a design conversation before the
token file is filled: the project's real material (its photos,
its existing brand marks) is the source, candidate palettes
are compared as rendered surfaces in both themes, and the
picked values land in the table above with the study as their
record. A palette generated in the abstract and applied
unseen is how per-theme mismatches ship.
