#!/usr/bin/env node
// verify-contrast.mjs — the contrast discipline, rerunnable.
//
// The generic kit's contrast gate, in the Workhorse Kit's
// pattern: every pair is auto-enumerated from
// tokens/tokens.json (never a hand-listed pair set), the
// bar is fatal by default, and the run prints its pair
// counts per part. Exit 1 on any failure.
//
// Part 1: every status TEXT token (the status tier's
// per-mode text values, distinct from its hues) must hold
// >= 4.5:1 (WCAG AA, normal text) against EVERY surface
// token, in both palettes x both modes. Status hues
// (glyph + border) are graphical and are NOT text-
// verified — the split is the tokens' own: a hue may sit
// low on a surface while its text variant holds the bar.
//
// Part 2: the CONTENT tokens join the net. Content
// primary and secondary are the essential-content voices
// and content muted is the meta voice (slugs, timestamps,
// counts, card meta lines) — all three hold the SAME
// fatal 4.5:1 bar on every surface, both palettes x both
// modes. Muted carries no lesser grading: in the
// Workhorse superapp a meta-only grading let muted ship
// at 2.91–3.71:1 across the surface set, a serious
// WCAG 2.2 AA failure on thousands of rendered nodes.
//
// Part 3: the TINT pairs join the net. Parts 1–2 check
// text against the five surface tokens, but a chip family
// renders status text on the status's own TINT —
// color-mix(hue, N%, transparent) composited over the
// surface beneath — a background outside the surface set;
// in the Workhorse Kit that class measured at hundreds of
// rendered nodes (worst 3.42:1) while its gate stood green
// over its enumeration. Part 3 enumerates:
//   A  status text on its own hue's tint at 14% (rest)
//      and at 22% (pressed), over every surface, both
//      palettes x both modes, the full status table;
//   A2 the content voices (primary, secondary) on the
//      stale tint at 14%, over every surface;
//   B  the mix badges: text = color-mix(hue,
//      BADGE_FG_HUE_PCT%, content-primary) on the hue's
//      tint at BADGE_TINT_PCT% over every surface, for
//      the ok/info/warn/fail badge tones (each tone's hue
//      is its status hue);
//   C  NoticeRow blends: fail text on color-mix(fail hue,
//      12%, surface-2); stale text on color-mix(stale
//      hue, 20%, surface-2) — opaque blends into
//      surface-2, not transparent tints.
// The Part 3 bar is the same fatal 4.5:1.
//
// The tint strengths and mix percentages above are
// THIS GATE's declared data — the constants the
// components spend (Chip/StatusChip/Badge tints at 14%,
// pressed at 22%; badge tint 16% with its foreground
// at a 30% hue step; NoticeRow blends at 12%/20%). A
// component that chooses different constants owes this
// file the same change, in the same change.
//
// Part 4: the SOLID pairs join the net. A solid fill is
// neither a surface nor a tint — it is an opaque token
// fill carrying its own on- token. Part 4 enumerates the
// token-defined solid text pairs: the notify badge pair
// (on-notify on notify) and Button's rest-state pairs
// (on-accent on accent, accent-hover, danger), both
// palettes x both modes, same fatal 4.5:1 bar. A solid
// text fill reads its token pair, never a primitive —
// that is what keeps the pair inside this enumeration.
//
// Part 5a (Step 5 of the governing plan): the NON-TEXT
// pairs join the net, at the WCAG non-text bar of 3:1,
// fatal. The source kits' failures in this class were
// never token values alone — they were SPENDS: a
// decorative hairline spent as a field's boundary
// (measured 1.24:1 in Steam Power), an accent spent as a
// focus indicator, a muted border step spent where a
// control's only edge should be. So Part 5a enumerates
// pairs AND censuses spends:
//   F1 the focus role against every surface — the
//      adjacent ground an outset ring actually sits on;
//   F2 the focus role against the tint grounds a
//      pressable chip's ring sits on (status tints at
//      14%/22% over every surface; the NoticeRow blends);
//   F3 the SEPARATOR pairs. The focus role sits on the
//      accent scale, and the solid fills a focused
//      control can carry ARE the accent family (a checked
//      Toggle track, a primary/danger Button) or a
//      same-family hue (a checked Checkbox's ok disc):
//      measured directly, focus-on-fill sits at
//      1.00–1.66:1 — the ring camouflages, the exact
//      defect the Workhorse critic confirmation pass
//      read as "switches paint no focus indicator". No
//      step on the scale cures it (a step far enough from
//      the fill fails the surfaces), so the kit's
//      components carry an inset separator band in the
//      fill's own on- colour, shipped as kit-owned theme
//      rules by the generator, and F3 prices the band:
//      on-accent against accent, accent-hover, and
//      danger; white (the Checkbox's check colour)
//      against the ok hue. The notify fill carries no
//      pair here: no focusable kit component renders on
//      or as the notify fill (it is a badge text pair,
//      Part 4) — a component that puts a focusable
//      control on a notify ground joins F3's separator
//      set in the same change.
//   B1 the field-border role against every surface —
//      the priced boundary every control spend below
//      was re-pointed to;
//   B2 the remaining state-identifying border spends
//      that already hold the bar and stay: the accent
//      border (Radio checked, Toggle off-state hover)
//      against every surface.
// The census (below, in code) scans ui-kit/components/
// and ui-kit/themes/ at gate time — never a hardcoded
// file list, because the source kits' hardcoded lists
// rotted the day a file split. It names every focus
// spend (a focus outline spending any token but the
// focus role is a finding), every outline-none (each
// must carry a classification in OUTLINE_NONE below,
// compensated by a named ring mechanism, or it is a
// finding; a classification whose spend vanished is
// itself a finding), the presence of the kit-owned
// focus rules in the generated themes, and every border
// token spend (each classified in BORDER_SPENDS as
// priced by a Part 5a family or decorative with its
// reason; an unclassified or stale spend is a finding).
// The decorative classifications, with their grounds
// measured at the step that wrote them: layout hairlines
// and frames (border-default at 1.08–2.01:1) identify
// nothing — regions are named by surface and content;
// the NoticeRow tone border is a same-hue reinforcement
// edge on its own tint — the tone is identified by its
// priced status text, tint, and icon. By contrast the
// spends this part RE-POINTED at field-border were the
// only boundary of a control or the marker of its state:
// Fields at rest and on hover, Button's secondary
// variant, Checkbox/Radio unchecked, Toggle off-state,
// SegmentedControl's checked segment — border-strong
// measured 1.45–2.88:1 and border-default 1.08–2.01:1
// on their grounds, under the bar everywhere. The
// decorative border tokens themselves are NOT retuned.
//
// Part 5b (Step 6 of the governing plan): the COMPOSITE
// grounds join the net — every color-mix state a
// component spends that carries text or a priced
// indicator, computed at its worst case, in the Steam
// overlay discipline (a stack is priced as the stack
// actually rendered: tint over scrim over ground). The
// mixes' constants are mirrored here as gate data (the
// Step 3 rule; the census below machine-checks them
// against the components' exported constants):
//   M1 Button's mix states as TEXT grounds, at the
//      text bar: on-accent on the primary-active mix,
//      the danger-hover mix, and the danger-active mix
//      (the fill mixed toward the press-shade role at
//      the mirrored percentages). Rest and token-hover
//      fills are Part 4's solid pairs.
//   M2 the same composites as SEPARATOR grounds, at
//      the non-text bar: the kit theme rule's inset
//      on-accent band rides the solid Buttons in every
//      state, so the band is priced against the mixes
//      as well as Part 5a's token fills.
//   M3 accent-soft grounds: content primary and
//      secondary on the accent-soft composite over
//      every surface (the AppShell active-nav ground).
//   M4 the AppShell hot-count stack: the fail badge's
//      mix text on its tint over accent-soft over
//      surface-1 — the one ground the stack can occupy,
//      because both SidebarNav containers spend
//      surface-1 (recorded here as gate data; a nav
//      ground change owes this family the same change).
//      The phone presentation renders the same badge on
//      surface-2 with no accent-soft beneath — that
//      stack is Part 3 family B's enumeration.
//   M5 the NoticeRow warn blend: warn text on
//      color-mix(warn hue, 20%, surface-2) — the spend
//      GroupedList actually ships. (Part 3 family C
//      prices the fail blend and the pattern's stale
//      blend; the shipped warn spend is priced here.)
//   M6 the highlight fills under content text:
//      content primary and secondary on the selection
//      and annotation fills (alpha composites read
//      from the tokens) over every surface. The priced
//      voices are primary and secondary — Part 3
//      family A2's precedent for tint grounds; muted
//      is priced on the surface set (Parts 1–2) and is
//      NOT a priced voice on a fill: a component that
//      needs meta text on a fill spends secondary
//      there. Measured at the seed's dark alpha (0.30)
//      the fills failed even secondary (worst 4.04:1,
//      sage/dark); the cure moved the dark fills to
//      0.22 — the light selection strength — not the
//      hues.
//   M7 the highlight BARS as indicators, at the
//      non-text bar: each bar against every surface
//      and against its own fill composited over every
//      surface (the bar sits on the fill it bounds).
//      Cures, both moves along the tokens' own scales:
//      the light annotation-bar moved one step darker
//      (yellow-700 -> yellow-800; it measured 2.98:1
//      on its own fill over sunken), and the dark
//      selection-bar re-pointed from the accent alias
//      to each palette's 100 step (the accent step
//      measures 2.46:1 against its own sage fill —
//      a bar cannot be its own fill's hue at strength
//      and read against it).
// The press endpoint is the semantic press-shade role
// (black in light, white in dark). Step 4's finding —
// Button shading toward primitive black in both modes
// for want of the role — is settled here by
// measurement: black in dark fails the danger-active
// text pair (3.63:1, sage/dark), while the mode-aware
// role holds every M1/M2 pair (worst 6.42:1). The role
// was added to the tokens and Button re-pointed at it;
// the gate prices the shipped role, per mode.
// Two composite classes are CLASSIFIED, not priced,
// with their reasons recorded in the census data
// below: the Sheet backdrop (it carries no text, and
// no text pair over it is well-formed) and muted on a
// highlight fill (above). The disabled-state opacity
// dimming (opacity-55 in Button/Checkbox/Fields/
// SegmentedControl/Toggle) is not a color-mix spend
// and is outside this census: an inactive control's
// dimming is the state indication itself, not a ground
// text must read against.
// The color-mix census (below, in code) scans the same
// tree as Part 5a's census at gate time: every
// color-mix( occurrence in ui-kit/components/ and
// ui-kit/themes/ must carry a classification in
// COLOR_MIX_SPENDS as priced by a named family or
// classified with its reason; an unclassified or stale
// spend is a finding. The census also machine-checks
// the mirrored constants against the components'
// exported values — a component that changes its
// constant without the gate fails here, which is the
// Step 3 rule enforced rather than restated.
//
// Usage: node ui-kit/tools/verify-contrast.mjs [--verbose]
// Exit 1 on any failure.

import {
  checked, contentChecked, contentFailures, failures,
  solidChecked, solidFailures, tintChecked, tintFailures,
} from "./contrast-parts.mjs";
import {
  borderSpendKeys, censusFailures, focusSpends, mixChecked,
  mixCensusFailures, mixFailures, mixNtChecked, mixNtFailures,
  mixSpendsClassified, ntChecked, ntFailures, outlineNoneCount,
  scannedFiles,
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
  `verify-contrast: ${ntChecked} non-text pairs checked (Part 5a), ` +
    `${ntFailures} failure(s)`,
);
console.log(
  `verify-contrast: spend census (Part 5a): ${scannedFiles.length} files scanned, ` +
    `${focusSpends} focus spends, ${outlineNoneCount} outline-none classified, ` +
    `${borderSpendKeys.size} border spends classified, ${censusFailures} failure(s)`,
);
console.log(
  `verify-contrast: ${mixChecked} composite text pairs checked (Part 5b), ` +
    `${mixFailures} failure(s)`,
);
console.log(
  `verify-contrast: ${mixNtChecked} composite non-text pairs checked (Part 5b), ` +
    `${mixNtFailures} failure(s)`,
);
console.log(
  `verify-contrast: color-mix census (Part 5b): ${scannedFiles.length} files scanned, ` +
    `${mixSpendsClassified} color-mix spends classified, ${mixCensusFailures} failure(s)`,
);
process.exit(
  failures ||
    contentFailures ||
    tintFailures ||
    solidFailures ||
    ntFailures ||
    censusFailures ||
    mixFailures ||
    mixNtFailures ||
    mixCensusFailures
    ? 1
    : 0,
);
