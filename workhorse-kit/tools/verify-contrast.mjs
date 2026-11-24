#!/usr/bin/env bun
// verify-contrast.mjs — the contrast discipline, rerunnable.
//
// Part 1 (Subplan-02): every status TEXT token must hold
// >= 4.5:1 (WCAG AA, normal text) against EVERY surface
// token, in both palettes x both modes. Status hues (glyph
// + border) are graphical and are NOT text-verified — the
// shipped set establishes exactly this split (e.g. stale's
// orange hue sits at ~2.3:1 on white while its text variant
// holds 5.3:1+). Alias texts (var(--wb-status-<other>-text))
// resolve to their target before checking.
//
// Part 2 (scanner rule 1 of the entries critic
// pass): the CONTENT tokens join the net. --wb-content-
// primary and --wb-content-secondary are the essential-
// content voices and must hold >= 4.5:1 against every
// surface token, both palettes x both modes — that bar is
// FATAL. --wb-content-muted is the META voice (slugs,
// timestamps, counts, card meta lines): the
// superapp critic pass (finding B-2) measured it at
// 2.91–3.71:1 across the surface set and filed it as a
// serious WCAG 2.2 AA failure on 4,229 rendered nodes, so
// the meta-only 3.4:1 grading once recorded here
// is superseded: muted now holds the SAME fatal 4.5:1 bar
// on every surface, both palettes x both modes, and its
// token values sit on the muted->secondary scale step that
// clears the bar while staying the subordinate voice.
//
// Part 3 (superapp critic re-run, finding
// N-1): the TINT pairs join the net. Parts 1-2 check text
// against the five surface tokens, but the kit's chip
// family renders status text on the status's own TINT —
// color-mix(hue, N%, transparent) composited over the
// surface beneath — a background outside the surface set.
// The re-run measured that class at 436 rendered nodes
// (worst 3.42:1) while this gate stood green over its
// enumeration. Part 3 enumerates every text-on-tint pair
// the components can produce, from the same tokens:
//   A  status text on its own hue's tint at 14% (Chip,
//      StatusChip, Badge "approved", Lane count) and at
//      22% (the Chip's pressed state), over every surface,
//      both palettes x both modes, the full status table;
//   A2 the content voices (primary, secondary) on the
//      stale tint at 14% (DegradedBanner, FieldError);
//   B  the mix badges (LogRow's KindBadge, AppShell's
//      hot CountBadge): text = color-mix(okabe hue,
//      BADGE_FG_HUE_PCT%, content-primary) on the hue's
//      tint at BADGE_TINT_PCT% over every surface;
//   C  NoticeRow: hard-gate text on color-mix(hue, 12%,
//      surface-2); stale text on color-mix(orange, 20%,
//      surface-2).
// The Part 3 bar is the same fatal 4.5:1. The mix
// percentages are the components' own constants, mirrored
// here as data (BADGE_* below; Chip 14/22, NoticeRow
// 12/20 inline) — a component that changes its mix owes
// this file the same change.
//
// Part 4 (superapp critic confirmation,
// finding F-2): the SOLID pairs join the net. Parts 1–3
// check text against surfaces and tints; a solid fill is
// neither — it is an opaque token fill carrying its own
// on- token. The confirmation pass measured the client
// Launcher's AppTile count badge (white text on the raw
// Okabe vermilion primitive the component read directly)
// at 3.87:1 while this gate stood green over its
// enumeration. Part 4 enumerates the token-defined solid
// text pairs: the notify badge pair (on-notify on
// notify) and Button's rest-state pairs (on-accent on
// accent, accent-hover, danger), both palettes x both
// modes, same fatal 4.5:1 bar. A solid text fill reads
// its token pair, never a primitive — that is what keeps
// the pair inside this enumeration. (Button's
// hover/active color-mix states are the component's own
// constants, not token pairs; they join the net in
// Part 5 below, mirrored as data the way Part 3 mirrors
// the mix badges.)
//
// Part 5 (superapp critic confirmation
// follow-up — the Button danger active state F9 measured
// at 3.92:1 olive/dark and 3.67:1 teal/dark and named
// outside its scope): the BUTTON STATE pairs join the
// net. Button (components/controls/Button.tsx) paints its primary
// and danger fills per state from the accent/danger
// tokens and color-mix steps toward a shade endpoint;
// the text is on-accent in every state. Part 4 covers
// the rest-state token pairs; this part enumerates the
// full state matrix as the component defines it — rest,
// hover, active for both variants, both palettes x both
// modes, same fatal 4.5:1 bar. The mix percentages are
// the component's own constants, mirrored here as data
// (BTN_* below) — a component that changes its state
// mixes owes this file the same change, exactly as
// Part 3's badge mixes do; the shade endpoint is the
// press-shade token, resolved per palette x mode.
//
// Part 6 (the generic-kit sync — Step 7 of
// the starter's check-adoption plan): the NON-TEXT pairs
// and the COMPOSITE grounds join the net, with the spend
// census that keeps them honest. Parts 1–5 price text
// and Button's states; the failures this part names were
// never token values alone — they were SPENDS: a
// decorative hairline spent as a field's boundary, an
// accent spent as a focus indicator against its own
// fill. The non-text families hold the WCAG non-text
// bar of 3:1; the composite text families hold 4.5:1.
//   F1 the focus-ring role against every surface — the
//      adjacent ground an outset ring sits on (worst
//      measured 4.51:1, teal/light sunken: it holds, and
//      is now enumerated rather than assumed);
//   F2 the focus-ring role against the tint grounds a
//      pressable chip's ring sits on (status tints at
//      14%/22% over every surface; the NoticeRow
//      blends) — worst 3.37:1, holds;
//   F3 the SEPARATOR pairs. The focus-ring token IS the
//      accent, and the solid fills a focused control can
//      carry are the accent family and the done disc:
//      measured directly, focus-on-fill sits at
//      1.00–2.40:1 — the ring camouflages, the defect the
//      critic confirmation pass read as
//      switches painting no indicator. No step on the
//      scale cures it, so the Toggle track and the
//      Checkbox disc carry an inset separator band in
//      the fill's own on- colour, shipped as kit-owned
//      theme rules by the generator, and F3 prices the
//      bands: on-accent against accent and accent-hover
//      (the Toggle's checked fills); white — the
//      Checkbox's check colour — against the done hue.
//      Button carries no band: its outline is outset, on
//      the adjacent ground F1 prices. The notify fill
//      carries no pair: no focusable component renders
//      on or as the notify fill (it is a badge text
//      pair, Part 4) — a component that puts a focusable
//      control on a notify ground joins F3's separator
//      set in the same change.
//   B1 the field-border role against every surface —
//      the priced boundary the identifying spends were
//      re-pointed to. The role is new in this sync: the
//      kit spent border-default (measured 1.21–1.30:1)
//      and border-strong (1.66–1.83:1) as control
//      boundaries, both under the bar on every ground.
//      Each palette x mode takes the step of its own
//      scale nearest the ground that clears 3:1 on all
//      five surfaces (olive 400 light / 300 dark, teal
//      500 light / 400 dark; worst 4.00:1). The
//      decorative border tokens are NOT retuned.
//   B2 the remaining state-identifying border spends
//      that already hold the bar and stay: the accent
//      border (Radio checked, Toggle off-state hover,
//      the accented Lane's left bar) against every
//      surface.
//   M3 the accent-soft ground (the AppShell active nav
//      row): content primary on the composite over every
//      surface, at the text bar. Secondary is not a
//      priced voice on this ground — the row's only text
//      spend is its primary label, and the count badge
//      carries its own grounds (sunken for the plain
//      badge; the vermilion tint for the hot one, Part 3
//      B and M4) — and measured, secondary on the
//      composite fails (worst 3.96:1, teal/dark), so a
//      component that puts secondary text on accent-soft
//      owes this family the pair and the cure in the
//      same change.
//   M4 the AppShell hot-count stack: the vermilion
//      badge's mix text on its tint over accent-soft
//      over surface-1 — the one ground the stack can
//      occupy, because the sidebar spends surface-1 and
//      the active row spends accent-soft (recorded here
//      as gate data; a nav ground change owes this
//      family the same change). The inactive-row stack
//      is Part 3 family B's enumeration.
//   M6 the highlight fills under text: content primary
//      on the selection and annotation fill composites
//      over every surface (the AnnotationBadge mark
//      styles — the marks set no text colour; the text
//      they wrap is the row's primary voice). Secondary
//      and muted are not priced voices on a fill:
//      measured, secondary cannot clear the bar on the
//      selection fill at any strength that leaves the
//      fill visible (worst 4.02:1 even at 16% alpha,
//      olive/light) — the limitation is recorded here
//      rather than cured by erasing the fill.
//   M7 the highlight BARS as indicators, at the
//      non-text bar: each bar against every surface and
//      against its own fill composited over every
//      surface (the bar is the mark's inset underline —
//      it sits on the fill it bounds). Two cures, both
//      moves along the tokens' own values: the dark
//      selection-bar re-pointed from the accent alias
//      to each palette's 100 step (the accent step
//      measures 2.89:1 against its own olive fill — a
//      bar cannot be its own fill's hue at strength and
//      read against it; the light step holds at 3.38:1
//      and stays), and the light annotation-bar
//      darkened along its hue (#b97e00 -> #8f6100; it
//      measured 2.72:1 on sunken and 2.25:1 on its own
//      fill).
// The census (below, in code) scans components/ at gate
// time — never a hardcoded file list, because hardcoded
// lists rot the day a file splits. It names every focus
// spend (an outline spending any token but focus-ring
// is a finding), every outline-none (each classified
// below, compensated by a named mechanism; a
// classification whose spend vanished is itself a
// finding), the presence of the kit-owned focus rules
// in the generated themes, every border token spend
// (each classified as priced by a Part 6 family,
// decorative with its reason, or provisional: a
// re-point owed elsewhere, which the census prints as
// a NOTE on every run until the spend moves — the one
// entry of that kind, Button's secondary boundary,
// retired when its re-point to field-border landed),
// and every
// color-mix spend (each classified as priced by a named
// part or classified with its reason — the two backdrop
// composites). This kit's mix percentages are inline
// literals in the components, not exported constants,
// so each classification's needle carries the value: a
// component that changes its percentage breaks the
// needle and fails here, which is the mirrored-constant
// rule enforced in this kit's form.
//
// Usage: bun viewer/tools/verify-contrast.mjs [--verbose]
// Exit 1 on any failure.

import {
  buttonChecked, buttonFailures, checked, contentChecked,
  contentFailures, failures, solidChecked, solidFailures,
  tintChecked, tintFailures,
} from "./contrast-parts.mjs";
import {
  borderSpendKeys6, censusFailures6, componentFiles6,
  focusSpends6, mix6Checked, mix6Failures, mixCensusFailures6,
  mixSpendsClassified6, ntChecked, ntFailures, outlineNoneCount6,
} from "./contrast-census.mjs";

console.log(
  `verify-contrast: ${checked} status-text/surface pairs checked, ` +
    `${contentChecked} content/surface pairs checked, ` +
    `${failures + contentFailures} failure(s)`,
);
console.log(
  `verify-contrast: ${tintChecked} text-on-tint pairs checked (Part 3), ` +
    `${tintFailures} failure(s)`,
);
console.log(
  `verify-contrast: ${solidChecked} text-on-solid pairs checked (Part 4), ` +
    `${solidFailures} failure(s)`,
);
console.log(
  `verify-contrast: ${buttonChecked} button-state pairs checked (Part 5), ` +
    `${buttonFailures} failure(s)`,
);
console.log(
  `verify-contrast: ${ntChecked} non-text pairs checked (Part 6), ` +
    `${ntFailures} failure(s)`,
);
console.log(
  `verify-contrast: spend census (Part 6): ${componentFiles6.length} files scanned, ` +
    `${focusSpends6} focus spends, ${outlineNoneCount6} outline-none classified, ` +
    `${borderSpendKeys6.size} border spends classified, ${censusFailures6} failure(s)`,
);
console.log(
  `verify-contrast: ${mix6Checked} composite text pairs checked (Part 6), ` +
    `${mix6Failures} failure(s)`,
);
console.log(
  `verify-contrast: color-mix census (Part 6): ${componentFiles6.length} files scanned, ` +
    `${mixSpendsClassified6} color-mix spends classified, ${mixCensusFailures6} failure(s)`,
);
process.exit(
  failures ||
    contentFailures ||
    tintFailures ||
    solidFailures ||
    buttonFailures ||
    ntFailures ||
    censusFailures6 ||
    mix6Failures ||
    mixCensusFailures6
    ? 1
    : 0,
);

