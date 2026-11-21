# Check-adoption census — Steam Power and Workhorse superapp vs the starter

Findings first: of 59 candidate checks censused, 16 are adopted into this
programme's steps, 21 are adapted (the mechanism crosses, the source form
does not), 11 are declined as domain-specific, and 11 are already present in
the starter's generic machinery. The material gaps are concentrated in three
places: the starter has no date/time one-home scanner in either source form,
no rendered-surface discipline scanners (raw elements, value slots, dead
classes), and no rendered accessibility legs at all — its a11y coverage is a
static HTML scanner plus a sample-page surface net. Every UI-layer contrast
mechanism exists only inside the Workhorse Kit, which the generic starter
neither references from `check.py` nor seeds into a new project; Steps 2–6 of
the governing plan for the generic UI kit programme
are the cure for that row.

Verdicts are against the starter's generic machinery — `check.py`,
`docs/checks.md`, the 21 scanners in `backend/foundation/scanners/registry.py`,
`flavors/webapp/`, `skills/` — verified 2026-11-17. Dispositions name the
plan step that carries the work; a candidate discovered later joins this
census before it joins the starter.

## A. Steam Power gate scanners (`tools/gate/*.mjs`)

Gate of record: `tools/gate/check.mjs` via `pnpm check`, aggregate-then-verdict.
Enforcement below is the gate-wired mode, not the standalone default.

| Candidate | Verifies | Starter verdict | Disposition |
|---|---|---|---|
| `adapter-mirror.mjs` | Postgres/SQLite adapter groups carry identical family map and factory exports; stale allowlist entries are findings | Partial — store contract tests prove behaviour; no mirror-map scanner | Adapt — Step 8 gate-shape lane, as the mirror-map form for multi-adapter ports |
| `asset-registration.mjs` | Every asset registered in the generated manifest; every referenced slug exists | Present — `asset_manifest` scanner | None — already carried |
| `catalog-drift.mjs` | No catalog fact (currency literals, verbatim descriptions) outside `packages/catalog` | Absent | Decline — Steam's catalog is domain data; the generic form is the `value_source` scanner, already present |
| `check.mjs` (runner) | Aggregate-then-verdict gate; pre-flight `node --check` parse guard over its own scanner modules and data files (a data file that did not parse once silently never ran) | Partial — starter `check.py` is fail-fast; no parse guard over gate data | Adapt — Step 10: the flavor's composed check gains the aggregate form and the parse guard |
| `contrast-pairs.mjs` | Ruled token pairs from shipped CSS hold WCAG bars (focus, field border, doc kicker, alert tones); report-only in Steam's gate wiring | Partial — Workhorse `verify-contrast.mjs` is fatal and wider, but kit-only | Adapt — Steps 3/5/6: its pair classes cross into the generic gate; the hand-listed, report-only form does not |
| `dead-classes.mjs` | A class referenced in tsx is defined in some stylesheet; report-only in Steam's wiring | Absent | Adopt — Step 8 frontend lane, fatal in the starter's form |
| `e2e-shard.mjs` | Committed 3-shard Playwright entry: HEAD + clean-tree assertion, per-shard ports/scratch, partition completeness (every spec in exactly one family) | Absent — no Playwright runner | Adapt — Step 9: the shard and partition discipline is the rendered legs' entry form |
| `employee-data.mjs` | No tracked file matching real crew-data basenames | Partial — `denylist`/`literal`/`tracking` cover literals and `var/`, not data-file basenames | Decline — crew-data basenames are Steam's domain; the generic literal machinery is already present |
| `file-input-chrome.mjs` | Upload surfaces use capture tiles, never visible file-input chrome | Absent | Decline — a Steam surface rule; the generic form is the kit's file primitive (Step 4), not a scanner |
| `file-length.mjs` | No source file over cap; header states it is a port of the starter's length scanner | Present — `length` scanner is the origin | None — already carried |
| `platform-branching.mjs` | No platform branching in apps — platform is an ambient token axis only | Absent | Decline for now — the platform axis is left out of the generic kit by the adopted ruling; this row rejoins the census if the axis is adopted |
| `port-boundary.mjs` | No vendor SDK or DB access outside the ports seam | Present — `port_boundary` scanner | None — already carried |
| `primitive-components.mjs` | No raw native button/input/select/textarea (and kin) on rendered surfaces outside an argued allowlist; stale allowlist entries are themselves findings | Absent — `a11y_static` checks names/alt/lang/tabindex only | Adopt — Step 8 frontend lane |
| `primitive-components-data.mjs` | The allowlist as a separate data file, parse-guarded by the runner | Absent | Adopt — Step 8 frontend lane: allowlist-as-data is the adopted form |
| `rule-ownership.mjs` | Client components never evaluate business rules (derivation shapes in `'use client'` code) | Partial — the rule exists (`layers`, fundamentals); no client rule-shape scanner | Adapt — Step 8 frontend lane, as the webapp flavor's TypeScript form |
| `surface-vocabulary.mjs` | Retired classes unreferenced, no cross-tier classes, one alert role owner, no scattered inline styles | Absent | Adapt — Step 8 frontend lane: the stale-allowlist discipline crosses; Steam's vocabulary data stays project-local |
| `table-classes.mjs` | Admin tables use the kit's table grammar classes | Absent | Decline — Steam's `.emp-table` grammar is project-specific; a generic table primitive is a Step 4 question, not a scanner |
| `time-ownership.mjs` | Every date/time derivation and render outside the one time package is a finding; minting is legal everywhere | Absent — no date/time scanner in the registry | Adopt — Step 8 date lane (with the superapp's `dateuniqueness` as the second proof of the mechanism) |
| `transfer-primitives.mjs` | Import/export surfaces build on the shared transfer package only | Absent | Decline — Steam's transfer domain; no generic counterpart exists to protect |
| `value-slots.mjs` | No %-capped nowrap/ellipsis value slot in kit CSS — values wrap or rows stack, never clip | Absent | Adopt — Step 8 frontend lane |

All Steam gate tools carry a `--self-test` form (synthetic fixture trees) in
lieu of a test harness; that form is adopted for TypeScript-side checks per
the governing plan's rulings.

## B. Steam Power kit pins (`packages/ui/src/*.test.ts`, fatal in `pnpm check`)

| Candidate | Verifies | Starter verdict | Disposition |
|---|---|---|---|
| `contrast.test.ts` | Contrast pairs derived from the binding the shipped CSS declares: HC-01 focus token 3:1 and every focus outline spends it, HC-02 field border 3:1 (not the hairline), HC-03 doc kicker/muted, HC-04 tick threshold, N-25 alert tones | Partial — Workhorse gate covers text pairs fatally; no focus pair, no field-border pair, no spent-token derivation | Adapt — Steps 3/5: the generic gate enumerates from tokens instead of CSS bindings; the HC pair classes land in Part 5 |
| `contrast-tone-text.test.ts` | Bare tone text spends the `-text` roles; 4.5:1 on both grounds in all style × mode combinations | Partial — Part 1 status-text pairs are the analogue; no bare-spend census | Adopt — Step 3 (status-text part) with the spend census in Step 5 |
| `contrast-classic.test.ts` | Per-axis pairs across all combinations, plus overlay pairs (hero scrims/gradients, eyebrow chip, glass panel worst case) | Absent — no overlay pairs anywhere in the starter | Adapt — Steps 3/6: per-palette × mode enumeration is the generic gate's native form; overlay worst-case pricing lands in Part 5b |
| `contrast-button-roles.test.ts` | Button role pairs hold 4.5:1 in all combinations, including on the role's own tint | Partial — the Workhorse gate's Part 4 covers rest-state solids only; hover/active mixes are outside its net | Adapt — Steps 3 (Part 4 form) and 6 (mix states) |
| `contrast-band-followups.test.ts` | Classic gradient band and photo-overlay pairs from a v1 disposition list | Absent | Decline — Steam surface content; the worst-case gradient principle is carried generically by Step 6 |
| `tokens.test.ts` | The hand-maintained CSS token file equals the token source values | Present in stronger form — the Workhorse generator makes the CSS, so no dual representation exists to guard | None — the generic kit follows the generator form (Step 2) |
| `platform.test.ts` | The shell renders the platform attribute; platform dresses on record in kit styles | Absent | Decline — no platform axis in the generic kit (adopted ruling) |
| `composition.test.ts`, `skeleton.test.ts`, `list-row-anatomy.test.ts` | Kit composition and anatomy pins (field prompt behaviour, row slots, segmented dress, button role forms) | Partial — the Workhorse kit carries a `Specimen` harness but no source-pin suite | Adapt — Step 4: anatomy contracts ride the Specimen and the primitives' own tests |

## C. Steam Power rendered e2e legs (`tests/e2e/`)

| Candidate | Verifies | Starter verdict | Disposition |
|---|---|---|---|
| `qa-axe.spec.ts` | axe-core WCAG 2.2 AA over the surface census × 390/768/1440 × both themes; synthetic red/green proof-of-function | Absent — `a11y_static` is static-only | Adopt — Step 9 |
| `qa-geometry.spec.ts` (+ `qa-measure.ts`) | No overflow or obscured content; target-size floors; dark pass; synthetic ruler proof | Partial — the surface net checks 320px overflow for the sample page only | Adopt — Step 9 |
| `qa-truncation.spec.ts` | Rendered text against its full text under ellipsis/clip/line-clamp, per viewport class | Absent | Adopt — Step 9 |
| `qa-dead-click.spec.ts` (+ `qa-sweep.ts`) | Navigation chrome and shell nav respond; identity-based re-finding; synthetic proof | Absent — the misclick audit in `docs/checks.md` is an inventory practice, no rendered sweep | Adopt — Step 9 |
| `qa-console-guards.spec.ts`, `qa-booking-guards.spec.ts`, `qa-confirmation-guards.spec.ts`, `qa-header-collision.spec.ts` | Rendered contract pins from critic findings (console cleanliness, booking/confirmation behaviour, header collision) | Absent | Adapt — Step 9: the practice (critic findings become rendered pins) crosses; Steam's specific guards do not |
| `cr2-kit-conformance.spec.ts` | Rendered surfaces conform to the kit (dress, composition) | Absent | Adapt — Step 9 practice applied to the generic kit's Specimen (Step 4 surface) |
| `screenshots.spec.ts` (+ `screenshots/`) | Pixel-diff against approved mockup references, with masked regions carrying reasons | Absent — mockup approval is documented (`docs/mockup-approval.md`) with no diff gate | Adapt — Step 9, as the parity leg where an approved mock exists |
| `route-coverage.spec.ts` (+ `surface-routes.ts`, `surface-sanity.spec.ts`) | Every page enrolled in exactly one of screenshot manifest / sanity census / reasoned exemption, both directions | Present in different form — `route_coverage` scanner enrolls routes with expiring exemptions | None — already carried; the e2e census form is a Step 9 input |

## D. Steam Power scripts and contract suites

| Candidate | Verifies | Starter verdict | Disposition |
|---|---|---|---|
| `scripts/verify.mjs` | Demo database hashed before/after the full verify run; any change fails | Present — `check.py` hashes real `var/` state around pytest | None — already carried |
| `scripts/e2e.mjs` | One canonical bare-clone e2e entry: installs the browser binary and builds when markers are missing | Absent | Adapt — Step 10: the pristine-copy proof takes this one-command form |
| Repository contract suites (`packages/data`, `scripts/postgres-contract.mjs`) | One contract suite unchanged against fake, SQLite, and real Postgres; the real-server leg skips honestly and loudly when no server exists | Partial — store contract tests present; no real-server leg | Adapt — the honest-skip real-server leg joins `docs/checks.md` as the pattern for database projects |
| `tools/smoke.mjs` | Boots the production build on throwaway state and exercises public + employee surfaces | Partial — the surface net is the in-gate analogue; nothing boots a built surface | Adapt — Step 10: the pristine-copy proof boots the built Specimen |

## E. Workhorse superapp gate legs and kit tools (`pipeline/gate/`, `kit/tools/`)

Supreme gate form: root `check.py` composing per-package `gate.json` leg
declarations through `pipeline/gate/runner.py`; a red leg is fatal.

| Candidate | Verifies | Starter verdict | Disposition |
|---|---|---|---|
| `linecap` | No tracked source file over the line cap | Present — `length` scanner, same rule | None — already carried |
| `portability` (+ root coverage rows) | Tracked files reference nothing outside the repo; denylist errors on a provisioned list's hits and reports nothing without one | Present — `portability` + `denylist` scanners | None — already carried |
| `pathdiscipline` | No root-climb path derivations, no cwd roots, no hardcoded home roots outside the one paths spine | Partial — `portability` bans home-anchored literals; the derivation-shape scan is absent | Adopt — Step 8 gate-shape lane |
| `importisolation` | A package imports nothing from sibling packages (declared bootstrap exceptions) | Partial — `layers` enforces backend tier direction only | Adapt — Step 8 gate-shape lane, as the webapp flavor's package form |
| `writeruniqueness` | One homed stage+rename writer; no truncate-writes to state-shaped paths elsewhere | Absent — `docs/checks.md` lists governed-literal scanners as noted, not implemented | Adopt — Step 8 gate-shape lane |
| `dateuniqueness` (+ `date_families.json`) | Shape-based AST scan: one homed module per date intent, the family→home map as data | Absent | Adopt — Step 8 date lane (with Steam's `time-ownership` as the second proof) |
| `foldercensus` | Folder file-count census on every run (warn/fail thresholds) | Present — the `folder_density` scanner is the generic form (cap, band, additions measured against `HEAD`) | Adopt — carried by the generic file-length and folder-density rule (2026-11-21); the superapp leg's warn/fail thresholds are a repo binding of the generic rule |
| ruff format/lint legs (`staticlegs.py`) | Format and lint over declared targets | Present — `check.py` static legs | None — already carried |
| `scanners` leg (`staticlegs.py`) | Delegates to a package's own scanner suite via a named module | Present — the scanner framework itself (`backend/foundation/checks/runner.py` + registry) | None — already carried |
| `isolation-unittest` | Suite wrapped in a real-state hash snapshot; any change fails the leg | Present — `check.py`'s test-isolation proof, same mechanism | None — already carried |
| AST import-graph targeting (`pipeline/gate/targeting/`) | Tests targeted by reverse-dependency import graph; prose-only changes detected from AST dumps | Absent — starter targeting is git-mirror mapping; `docs/checks.md` already lists this as a noted upgrade | Adapt — stays a documented upgrade pattern in `docs/checks.md`; no build step in this programme |
| `frontends.json` served-by legs | Per-app frontend legs (build, typecheck, mock validation, render smoke) declared as data, served by each app's own scripts | Partial — the webapp flavor's composed check is the generic analogue; served-by declarations are absent | Adapt — Step 10: the flavor check gains kit legs in served-by form |
| `kit/tools/verify-contrast.mjs` Parts 1–4 | Status/content/muted text on surfaces, text-on-tint with component constants mirrored as data, text-on-solid via `on-` pairs; fatal | Absent generically — kit-only; the starter's surface net computes contrast only over the sample page's declared colours | Adopt — Steps 3/5/6 as the generic kit's gate |
| `kit/tools/gen-tokens.mjs` | Deterministic token→CSS generation; byte-identical regeneration is the drift proof | Absent generically — the starter frontend has no tokens; `templates/ui-tokens-template.md` is a prose template | Adopt — Step 2 (the generic kit's generator) |
| `kit/tools/verify-log-payload.mjs` | Deterministic pins for the LogRow clamp predicate | Absent | Adapt — Step 4 decides with the LogRow-pattern primitive: carried only if that primitive is |
| `kit_drift` (publish prep) | A vendored kit matches its manifest and a live starter checkout, or it does not publish | Absent | Decline — a consumer repo's vendoring discipline; the starter is the source and has nothing to drift against |
| `artifact/client/parity-check.mjs` | One HTML doc, one entry bundle, no frame-shell iframes or action relay | Absent | Decline — the superapp's one-app history as a check; no generic starter surface carries that failure mode |
| `venvbuild` | Shared venv builder leg support | Partial — `init_venv.py` is the starter's own form of the same leg | Adapt — form already carried by `init_venv.py`; no new work |
| Package command legs (`sched validate`, `sched census`, per-package suites in `gate.json`) | Package-domain commands enrolled as gate legs | Absent as content; the data-declared leg form is item `frontends.json` above | Decline — the commands are package domain; the declaration form is the adapted item |

## Counts

- Adopt: 16 — `dead-classes`, `primitive-components`, `primitive-components-data`, `time-ownership`, `value-slots`, `contrast-tone-text`, `qa-axe`, `qa-geometry`, `qa-truncation`, `qa-dead-click`, `pathdiscipline`, `writeruniqueness`, `dateuniqueness`, `verify-contrast`, `gen-tokens`, `foldercensus`
- Adapt: 21 — `adapter-mirror`, `check.mjs` runner form, `contrast-pairs`, `e2e-shard`, `rule-ownership`, `surface-vocabulary`, `contrast.test.ts`, `contrast-classic`, `contrast-button-roles`, composition/anatomy pins, `qa-*` guard pins, `cr2-kit-conformance`, `screenshots`, `scripts/e2e.mjs`, repository contract real-server leg, `tools/smoke.mjs`, `importisolation`, AST targeting pattern, `frontends.json` served-by form, `verify-log-payload`, `venvbuild`
- Decline: 11 — `catalog-drift`, `employee-data`, `file-input-chrome`, `platform-branching`, `table-classes`, `transfer-primitives`, `contrast-band-followups`, `platform.test.ts`, `kit_drift`, `parity-check`, package command legs
- Already present: 11 — `asset-registration`, `file-length`, `port-boundary`, `tokens.test.ts`, `route-coverage` e2e form, `scripts/verify.mjs` isolation hash, `linecap`, `portability`, ruff legs, `scanners` leg, `isolation-unittest`
