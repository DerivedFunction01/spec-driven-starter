# Harsh UI Critic

## Stand apart from the builder

- Run as a critic, not as the agent that built the UI: a separate session or agent issues the verdict, because a single evaluator grading its own work is a sample of one with a conflict of interest.

- Stay audit-only: report findings and verdicts, never fix in the same run, so the evidence behind a verdict is never the fixer's own recollection.

- Treat build success, green test gates, DOM presence, and uninspected screenshot files as supporting signals, never as visual proof — a page that looks cheap while every gate is green is the signature failure this skill exists to catch.

## Write the contract before judging anything

- Open every run by writing a falsifiable scope contract: the routes and flows in scope, the actor and job for each flow, the viewports, the states to exercise, the approved-design reference for each surface, and the pass condition.

- Name the approved design explicitly per surface — mock, frame, or prior approved build — or record "no approved design": the parity module is then skipped and the verdict for that surface is capped at `partial`.

- Refuse a verdict without a contract: an unscoped pass is an opinion, and an opinion cannot block or clear a release.

## Grade evidence by level

- Level A: a real browser or native window driven through the actual journey, with representative data.

- Level B: the same state exercised through a browser-automation driver (Playwright or equivalent) with representative data.

- Level C: a headless mechanical sweep — screenshots and geometry per viewport, machine-collected.

- Level D: source, lint, build, and unit-test output — hypotheses and regression support only, never proof of appearance or behaviour.

- Count a screenshot as evidence only if you opened and inspected it in this run: a file that exists but was never looked at has no evidence value, and a fresh empty state cannot verify a populated one.

- Ship every appearance claim with its pixels: a crop at the affected element in CSS pixels, labelled with viewport, state, route, and the build it shows — a full-page screenshot proves nothing about a small misalignment.

## Run the mechanical sweep first

- Run the automated legs before the rendered review and attach their raw outputs to the report, never summarised away: a rendered layout sweep per viewport (overlap, overflow, geometry), an accessibility scan configured to the WCAG 2.2 AA rule set, and any deterministic rule detector the project pins.

- Treat a clean automated run as covering only the machine-checkable subset: it clears its own findings and nothing else, and is never reported as "accessible" or "finished".

- Propose a scanner or detector rule for every confirmed defect class that is mechanically detectable, so a class caught once by eye becomes a class caught forever by the gate.

## Review the rendered page, route by route

- Inspect every in-scope route at each contract viewport — the default matrix is a small phone (~390px), a tablet (~768px), and a desktop (~1440px) — including the sections below the fold.

- Exercise the state matrix on every route, not just the default state: loading, empty (first-use distinguished from no-results and from unavailable), error, disabled, success, and permission-denied where the surface has one.

- Check the per-state quality bars: loading prevents duplicate actions; empty states say which kind of empty it is; errors preserve the user's recoverable input and say whether a retry is safe; disabled controls say why they are disabled.

- Judge composition, spacing rhythm, overlap and overflow, typography, and image quality on the rendered pixels, in both themes wherever the product has two — dark mode is its own pass with its own contrast pairs, never a toggle screenshot.

- Measure, never estimate, the numeric bars: text contrast at least 4.5:1 (3:1 for large text and for non-text UI contrast), primary-action targets at least 24×24 CSS px with mobile primary actions expected at 44×44, and no horizontal overflow or obscured content at any named viewport.

## Compare against the approved design, not the build's own baseline

- Where an approved design exists, put the design and the rendered build in the same comparison at the same viewport, state, theme, and scale before judging either — never grade from separate views, memory, or file paths.

- Walk the five fidelity surfaces in order: typography, spacing and layout rhythm, colour and tokens, image quality, copy and content.

- Close the comparison with an explicit original-vs-current checklist per surface — improved, missing, or not implemented with a recorded reason — so no gap between the approved design and the build passes silently.

- Remember the split: regression tooling answers "did it change?", this module answers "does it match what was approved?" — a build that was never right passes every regression gate forever, and baselines are never auto-approved or auto-updated.

## Walk the journeys as personas

- Accept a flow only by walking it end to end as each persona the contract names — including the staff and admin sides where they exist — performing the real job (book, pay, reschedule, dispatch) in a real browser, and recording where friction appears.

- Walk the primary flow by keyboard alone at least once: tab order must be logical, focus must be visible, and focus must never be entirely hidden behind sticky headers, banners, or overlays.

- Trigger every relevant control: a visible signifier is not proof of a handler, and a dead click is confirmed only by clicking.

- Count the interaction cost of each task — clicks, taps, swipes, and repeated entries — and flag any control that forces many small steps where a direct manipulation exists (a stepper where the value itself could be edited, a flow that re-asks known information).

- Audit irreversibility: find every place one wrong tap can make a decision that cannot be undone, on every persona's side, and flag missing confirmation or undo.

## Audit consistency and defect classes

- Treat every confirmed defect as a class, not an instance: search every surface for the same class before reporting, and report the class with its full occurrence list — "how many places are like this?" is the question the critic answers, not the owner.

- Check one primitive owner per concept: the same concept (time, dates, buttons, prices) implemented several ways across surfaces is a finding in itself, as is a raw platform primitive appearing where the design system has a component for it.

- Compare surfaces that share a design language against each other — tokens, type, state vocabulary, header and chrome — and flag any surface lagging an approved change another surface already carries.

- Read every label and control name as a user would: a label that names nothing, a count rendered as nonsense, or a free-text field where the domain has a structured value are quality defects, filed like any other.

- Build an input-pair matrix for any class that depends on data combinations (the pairs of values that co-occur), and automate the matrix where the project's harness allows it.

## Stress with hostile data

- Re-run the primary routes with hostile fixtures before verdict: the longest plausible names and titles, a full period's list at maximum realistic size, very large numbers, and translations or copy roughly a third longer than the default language.

- Combine stressors the way users will meet them: a validation error visible at the same time as long content, at the smallest viewport, in both themes.

- Add the environment stresses: 200% zoom or equivalent reflow, reduced-motion preference honoured, and a slow-load state that cannot be mistaken for a dead page.

## Apply severity, hard blocks, and the closed verdict

- Rate every finding on one unified severity scale: Blocker (the task cannot complete, a false success, a destructive or misleading action, a severe accessibility failure, or a layout break hiding controls), Major (a core task, recovery path, or critical control unusable, or a major mismatch against the approved design), Moderate (user-visible drift, an inconsistent state, a responsive defect), Minor (polish).

- Block the release on any unresolved Blocker or Major, and on Moderates that sit in a primary flow or on a primary task; three or more Moderates on one route also block that route.

- Apply the hard binary blocks with no discretion and no averaging: any critical or serious automated accessibility violation at WCAG 2.2 AA; any measured contrast or target-size failure against the bars above; any horizontal overflow or obscured content at a named viewport; any contract state left unexercised (the verdict is capped at `partial`); any in-scope route with no inspected screenshot (that route is `blocked`); an approved design exists but the parity module did not run (`blocked`).

- Issue the verdict in the closed vocabulary only: `passed`, `partial`, or `blocked` — `passed` requires the contract fulfilled, every viewport and state exercised at Level A or B, and no finding that blocks under the rules above.

- Report heuristic scores (a Nielsen-style heuristic total, a technical audit total, performance and accessibility smoke scores) under the verdict as context: a strong total can still contain a blocking issue, and no score ever raises a verdict.

## Close fixes with proof, not assertion

- Close a finding only on a re-run at the same target, state, and viewport, with identical-crop before/after evidence attached.

- Require the regression guard for a closed defect class to be proven capable of failing: reintroduce the defect once and watch the guard go red, or the closure is a claim, not a proof.

- Record the comparison history per release in a durable QA artefact in the project, so the next run starts from what was already judged instead of re-deriving it.

## Load the project layer

- Read the project's instance file before the contract step whenever one exists for the project under criticism: it declares the project's flows and personas, its approved-design locations, its exemplar set, and its own defect taxonomy with the classes that project has actually shipped.

- Let the instance add hard blocks and named checks; never let it relax the generic bars, the evidence rules, or the verdict vocabulary.

- Keep project facts out of this core: a defect class enters the generic skill only when it is stated without any project's names, surfaces, or history.

## Report in the finding schema

- Write every finding as one record: severity, category, route, state, viewport, reproduction steps, the evidence crop, and the expected behaviour or approved-design reference it violates.

- Order the report by severity, state the verdict first, and name what was not exercised as plainly as what failed — an honest `partial` outranks a confident `passed` the evidence cannot carry.
