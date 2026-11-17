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

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const tokens = JSON.parse(readFileSync(join(here, "..", "tokens", "tokens.json"), "utf8"));
const verbose = process.argv.includes("--verbose");
const SURFACES = ["canvas", "1", "2", "3", "sunken"];

function lin(channel) {
  const c = channel / 255;
  return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92;
}

function luminance(hex) {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function ratio(fg, bg) {
  let [l1, l2] = [luminance(fg), luminance(bg)];
  if (l1 < l2) [l1, l2] = [l2, l1];
  return (l1 + 0.05) / (l2 + 0.05);
}

// Resolve a token $value to a hex: a literal, a DTCG
// alias ({primitive...} / {semantic...}) followed
// through the token tree, or a var(--ui-status-<other>)
// / var(--ui-status-<other>-text) reference to another
// status's hue or same-mode text.
function resolveColor(raw, mode, seen = new Set()) {
  if (raw.startsWith("#")) return raw;
  const textAlias = raw.match(/^var\(--ui-status-([a-z-]+)-text\)$/);
  if (textAlias) {
    if (seen.has(textAlias[1])) throw new Error(`alias loop: ${raw}`);
    seen.add(textAlias[1]);
    return resolveColor(tokens.status[textAlias[1]].text[mode].$value, mode, seen);
  }
  const hueAlias = raw.match(/^var\(--ui-status-([a-z-]+)\)$/);
  if (hueAlias) {
    if (seen.has(hueAlias[1])) throw new Error(`alias loop: ${raw}`);
    seen.add(hueAlias[1]);
    return resolveColor(tokens.status[hueAlias[1]].hue.$value, mode, seen);
  }
  if (raw === "var(--ui-content-secondary)") {
    throw new Error(
      "var(--ui-content-secondary) is palette/mode-scoped; resolve it via resolveSemantic in that scope",
    );
  }
  const dtcg = raw.match(/^\{(.+)\}$/);
  if (dtcg) {
    let node = tokens;
    for (const part of dtcg[1].split(".")) node = node[part];
    return resolveColor(node.$value, mode, seen);
  }
  throw new Error(`cannot resolve color value: ${raw}`);
}

// Resolve a semantic $value in a palette x mode scope:
// literals, DTCG aliases (including {semantic...}
// self-references), and the scope's own content voices.
function resolveSemantic(raw, palette, mode) {
  let v = raw;
  while (typeof v === "string" && !v.startsWith("#")) {
    if (v === "var(--ui-content-secondary)") {
      v = tokens.semantic[palette][mode].content.secondary.$value;
      continue;
    }
    const m = v.match(/^\{(.+)\}$/);
    if (!m) throw new Error(`cannot resolve semantic value: ${raw}`);
    let node = tokens;
    for (const part of m[1].split(".")) node = node[part];
    v = node.$value;
  }
  return v;
}

const surfaceHex = (palette, mode, surface) =>
  resolveSemantic(tokens.semantic[palette][mode].surface[surface].$value, palette, mode);
const contentHex = (palette, mode, voice) =>
  resolveSemantic(tokens.semantic[palette][mode].content[voice].$value, palette, mode);

// Part 1 — status text x surfaces.
let failures = 0;
let checked = 0;
for (const [name, st] of Object.entries(tokens.status)) {
  for (const mode of ["light", "dark"]) {
    const text = resolveColor(st.text[mode].$value, mode);
    for (const palette of Object.keys(tokens.semantic)) {
      for (const surface of SURFACES) {
        const bg = surfaceHex(palette, mode, surface);
        const r = ratio(text, bg);
        checked += 1;
        const ok = r >= 4.5;
        if (!ok) failures += 1;
        if (verbose || !ok) {
          console.log(
            `${ok ? "PASS" : "FAIL"} status-${name} text ${text} on ` +
              `${palette}/${mode}/surface-${surface} ${bg}: ${r.toFixed(2)}:1`,
          );
        }
      }
    }
  }
}

// Part 2 — content tokens x surfaces. Every content
// voice — primary, secondary, and muted — holds the AA
// bar (4.5:1) on every surface, fatally.
const CONTENT_VOICES = ["primary", "secondary", "muted"];
let contentChecked = 0;
let contentFailures = 0;
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    for (const voice of CONTENT_VOICES) {
      const text = contentHex(palette, mode, voice);
      for (const surface of SURFACES) {
        const bg = surfaceHex(palette, mode, surface);
        const r = ratio(text, bg);
        contentChecked += 1;
        const ok = r >= 4.5;
        if (!ok) contentFailures += 1;
        if (verbose || !ok) {
          console.log(
            `${ok ? "PASS" : "FAIL"} content-${voice} ${text} on ` +
              `${palette}/${mode}/surface-${surface} ${bg}: ${r.toFixed(2)}:1`,
          );
        }
      }
    }
  }
}

// Part 3 — text on tints (see the header note). A tint
// is color-mix(hue, N%, transparent) composited over the
// surface beneath, so the rendered background is the
// per-channel blend of the hue at N% with that surface;
// a mix of two opaque colours is the same blend without
// the surface step.
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function rgbToHex(rgb) {
  return `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}
function mixRgb(a, pct, b) {
  return a.map((v, i) => (pct * v + (100 - pct) * b[i]) / 100);
}
function ratioRgb(fg, bg) {
  // Same luminance math as ratio(), on raw float channels
  // so blends keep full precision until the verdict.
  const lumRaw = (rgb) =>
    0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
  let [l1, l2] = [lumRaw(fg), lumRaw(bg)];
  if (l1 < l2) [l1, l2] = [l2, l1];
  return (l1 + 0.05) / (l2 + 0.05);
}

let tintChecked = 0;
let tintFailures = 0;
function checkTint(family, label, fgRgb, bgRgb) {
  const r = ratioRgb(fgRgb, bgRgb);
  tintChecked += 1;
  const ok = r >= 4.5;
  if (!ok) tintFailures += 1;
  if (verbose || !ok) {
    console.log(
      `${ok ? "PASS" : "FAIL"} [${family}] ${label}: ` +
        `${rgbToHex(fgRgb)} on ${rgbToHex(bgRgb)}: ${r.toFixed(2)}:1`,
    );
  }
}

// A — status text on its own hue's tint (14% rest /
// 22% pressed; the strengths are this gate's declared
// constants — see the header note).
for (const [name, st] of Object.entries(tokens.status)) {
  for (const mode of ["light", "dark"]) {
    const text = hexToRgb(resolveColor(st.text[mode].$value, mode));
    const hue = hexToRgb(resolveColor(st.hue.$value, mode));
    for (const palette of Object.keys(tokens.semantic)) {
      for (const surface of SURFACES) {
        const bg = hexToRgb(surfaceHex(palette, mode, surface));
        for (const pct of [14, 22]) {
          checkTint(
            "A",
            `status-${name} text on own tint ${pct}% / ${palette}/${mode}/surface-${surface}`,
            text,
            mixRgb(hue, pct, bg),
          );
        }
      }
    }
  }
}
// A2 — content voices on the stale tint at 14%
// (banner / field-error grounds).
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const hue = hexToRgb(resolveColor(tokens.status.stale.hue.$value, mode));
    for (const voice of ["primary", "secondary"]) {
      const text = hexToRgb(contentHex(palette, mode, voice));
      for (const surface of SURFACES) {
        const bg = hexToRgb(surfaceHex(palette, mode, surface));
        checkTint(
          "A2",
          `content-${voice} on stale tint 14% / ${palette}/${mode}/surface-${surface}`,
          text,
          mixRgb(hue, 14, bg),
        );
      }
    }
  }
}
// B — the mix badges: text = color-mix(hue, FG%, the
// palette/mode's content-primary) on the hue's tint.
// The percentages are this gate's declared constants,
// mirrored here (see the header note); each tone's hue
// is its status hue.
const BADGE_TINT_PCT = 16;
const BADGE_FG_HUE_PCT = 30;
const BADGE_TONES = ["ok", "info", "warn", "fail"];
for (const tone of BADGE_TONES) {
  const hue = hexToRgb(resolveColor(tokens.status[tone].hue.$value, "light"));
  for (const palette of Object.keys(tokens.semantic)) {
    for (const mode of ["light", "dark"]) {
      const primary = hexToRgb(contentHex(palette, mode, "primary"));
      const text = mixRgb(hue, BADGE_FG_HUE_PCT, primary);
      for (const surface of SURFACES) {
        const bg = hexToRgb(surfaceHex(palette, mode, surface));
        checkTint(
          "B",
          `${tone} badge text (hue ${BADGE_FG_HUE_PCT}% mix) on tint ${BADGE_TINT_PCT}% / ${palette}/${mode}/surface-${surface}`,
          text,
          mixRgb(hue, BADGE_TINT_PCT, bg),
        );
      }
    }
  }
}
// C — NoticeRow: status text on the hue mixed INTO
// surface-2 (an opaque blend, not a transparent tint):
// the fail tone at 12%, the stale tone at 20%.
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const s2 = hexToRgb(surfaceHex(palette, mode, "2"));
    const failHue = hexToRgb(resolveColor(tokens.status.fail.hue.$value, mode));
    const failText = hexToRgb(resolveColor(tokens.status.fail.text[mode].$value, mode));
    checkTint(
      "C",
      `fail text on mix(hue 12%, surface-2) / ${palette}/${mode}`,
      failText,
      mixRgb(failHue, 12, s2),
    );
    const staleHue = hexToRgb(resolveColor(tokens.status.stale.hue.$value, mode));
    const staleText = hexToRgb(resolveColor(tokens.status.stale.text[mode].$value, mode));
    checkTint(
      "C",
      `stale text on mix(hue 20%, surface-2) / ${palette}/${mode}`,
      staleText,
      mixRgb(staleHue, 20, s2),
    );
  }
}

// Part 4 — text on solid fills (see the header note).
// The fills are opaque, so the pair is the whole story:
// the fill token and its on- token, read straight from
// the semantic tokens (DTCG aliases resolved), per
// palette x mode.
let solidChecked = 0;
let solidFailures = 0;
function checkSolid(label, fgHex, bgHex) {
  const r = ratio(fgHex, bgHex);
  solidChecked += 1;
  const ok = r >= 4.5;
  if (!ok) solidFailures += 1;
  if (verbose || !ok) {
    console.log(
      `${ok ? "PASS" : "FAIL"} [solid] ${label}: ` +
        `${fgHex} on ${bgHex}: ${r.toFixed(2)}:1`,
    );
  }
}
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const sem = tokens.semantic[palette][mode];
    checkSolid(
      `on-notify on notify / ${palette}/${mode}`,
      resolveSemantic(sem["on-notify"].$value, palette, mode),
      resolveSemantic(sem.notify.$value, palette, mode),
    );
    for (const fill of ["accent", "accent-hover", "danger"]) {
      checkSolid(
        `on-accent on ${fill} / ${palette}/${mode}`,
        resolveSemantic(sem["on-accent"].$value, palette, mode),
        resolveSemantic(sem[fill].$value, palette, mode),
      );
    }
  }
}

// Part 5a — non-text pairs (focus + boundaries) and the
// spend census (see the header note). All bars are the
// WCAG non-text 3:1, fatal.
const NON_TEXT_BAR = 3;
let ntChecked = 0;
let ntFailures = 0;
function checkNT(family, label, r) {
  ntChecked += 1;
  const ok = r >= NON_TEXT_BAR;
  if (!ok) ntFailures += 1;
  if (verbose || !ok) {
    console.log(`${ok ? "PASS" : "FAIL"} [${family}] ${label}: ${r.toFixed(2)}:1`);
  }
}
const semHex = (palette, mode, path) => {
  let node = tokens.semantic[palette][mode];
  for (const part of path.split(".")) node = node[part];
  return resolveSemantic(node.$value, palette, mode);
};
const focusHex = (palette, mode) => semHex(palette, mode, "focus");
const fieldHex = (palette, mode) => semHex(palette, mode, "field-border");

// F1 — focus role x every surface.
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const focus = focusHex(palette, mode);
    for (const surface of SURFACES) {
      checkNT(
        "F1",
        `focus on surface-${surface} / ${palette}/${mode}`,
        ratio(focus, surfaceHex(palette, mode, surface)),
      );
    }
  }
}
// F2 — focus role x tint grounds: status tints at
// 14%/22% over every surface (the pressable chip's ring
// ground), and the NoticeRow opaque blends into
// surface-2 (fail 12%, stale/warn family at 20% — the
// warn blend is the NoticeRow warn ground).
for (const [name, st] of Object.entries(tokens.status)) {
  for (const mode of ["light", "dark"]) {
    const hue = hexToRgb(resolveColor(st.hue.$value, mode));
    for (const palette of Object.keys(tokens.semantic)) {
      const focus = hexToRgb(focusHex(palette, mode));
      for (const surface of SURFACES) {
        const bg = hexToRgb(surfaceHex(palette, mode, surface));
        for (const pct of [14, 22]) {
          checkNT(
            "F2",
            `focus on status-${name} tint ${pct}% / ${palette}/${mode}/surface-${surface}`,
            ratioRgb(focus, mixRgb(hue, pct, bg)),
          );
        }
      }
    }
  }
}
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const focus = hexToRgb(focusHex(palette, mode));
    const s2 = hexToRgb(surfaceHex(palette, mode, "2"));
    for (const [tone, pct] of [
      ["fail", 12],
      ["warn", 20],
    ]) {
      const hue = hexToRgb(resolveColor(tokens.status[tone].hue.$value, mode));
      checkNT(
        "F2",
        `focus on NoticeRow ${tone} blend ${pct}% / ${palette}/${mode}`,
        ratioRgb(focus, mixRgb(hue, pct, s2)),
      );
    }
  }
}
// F3 — the separator pairs: the inset band a solid-fill
// focusable carries, priced against its fill. on-accent
// against the accent-family fills (Toggle checked track,
// Button primary/danger and their hover/active steps
// ride accent-hover and danger); white — the Checkbox's
// check colour, a primitive — against the ok hue (the
// checked disc's fill).
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const onAccent = semHex(palette, mode, "on-accent");
    for (const fill of ["accent", "accent-hover", "danger"]) {
      checkNT(
        "F3",
        `separator on-accent on ${fill} / ${palette}/${mode}`,
        ratio(onAccent, semHex(palette, mode, fill)),
      );
    }
    const white = resolveColor(tokens.primitive.color.white.$value, mode);
    const okHue = resolveColor(tokens.status.ok.hue.$value, mode);
    checkNT("F3", `separator white on ok fill / ${palette}/${mode}`, ratio(white, okHue));
  }
}
// B1 — field-border role x every surface: the priced
// boundary for Fields (rest and hover), Button
// secondary, Checkbox/Radio unchecked, Toggle off-state,
// and SegmentedControl's checked segment (whose grounds
// are its surface-2 fill and the sunken track — both in
// the surface set).
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const field = fieldHex(palette, mode);
    for (const surface of SURFACES) {
      checkNT(
        "B1",
        `field-border on surface-${surface} / ${palette}/${mode}`,
        ratio(field, surfaceHex(palette, mode, surface)),
      );
    }
  }
}
// B2 — the accent border spends that stay (Radio
// checked; Toggle off-state hover): the accent against
// every surface.
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const accent = semHex(palette, mode, "accent");
    for (const surface of SURFACES) {
      checkNT(
        "B2",
        `accent border on surface-${surface} / ${palette}/${mode}`,
        ratio(accent, surfaceHex(palette, mode, surface)),
      );
    }
  }
}

// Part 5a census — spends scanned from the tree at gate
// time (see the header note). Classifications are gate
// data; the scan itself is generated, never listed.
const kitRoot = join(here, "..");
function scanDir(dir, exts) {
  return readdirSync(join(kitRoot, dir))
    .filter((f) => exts.some((e) => f.endsWith(e)))
    .map((f) => ({ name: f, text: readFileSync(join(kitRoot, dir, f), "utf8") }));
}
const scannedFiles = [
  ...scanDir("components", [".tsx"]),
  ...scanDir("themes", [".css"]),
];
let censusFailures = 0;
function censusFail(label) {
  censusFailures += 1;
  console.log(`FAIL [census] ${label}`);
}
// Focus spends: every focus outline must spend the
// focus role.
let focusSpends = 0;
for (const file of scannedFiles) {
  focusSpends += (
    file.text.match(/outline-\(--ui-focus\)|outline: 2px solid var\(--ui-focus\)/g) || []
  ).length;
  for (const m of file.text.matchAll(/outline[^;\n"]*?var\(--ui-([a-z-]+)\)/g)) {
    if (m[1] !== "focus") {
      censusFail(`${file.name}: a focus outline spends --ui-${m[1]}, not the focus role`);
    }
  }
}
if (focusSpends === 0) censusFail("no focus spends found — the census is blind");
// outline-none: each occurrence must be classified
// here, compensated by the named mechanism; a
// classification whose spend vanished is stale and
// itself a finding.
const OUTLINE_NONE = [
  {
    file: "Toggle.tsx",
    needle: "ui-toggle group",
    by: "group ring on the track span (group-focus-visible utilities) + the kit theme rule .ui-toggle:focus-visible .ui-toggle-track",
  },
  {
    file: "StatusChip.tsx",
    needle: "focus-visible:outline-none",
    by: "group ring on the chip span (the GROUP_FOCUS utilities)",
  },
  {
    file: "Sheet.tsx",
    needle: "focus-visible:outline-none",
    by: "the panel is a programmatic focus target (tabIndex -1), not an operable control — the modal panel's own appearance (surface-3 + shadow over the backdrop) is the indication, and every operable control inside carries its own ring",
  },
];
let outlineNoneCount = 0;
for (const file of scannedFiles) {
  const found = (file.text.match(/outline-none/g) || []).length;
  outlineNoneCount += found;
  const expected = OUTLINE_NONE.filter((c) => c.file === file.name);
  if (found !== expected.length) {
    censusFail(
      `${file.name}: ${found} outline-none occurrence(s), ${expected.length} classification(s)`,
    );
  }
  for (const c of expected) {
    if (!file.text.includes(c.needle)) {
      censusFail(`${file.name}: stale outline-none classification (needle not found)`);
    } else if (verbose) {
      console.log(`PASS [census] ${file.name}: outline-none compensated by ${c.by}`);
    }
  }
}
// The kit-owned focus rules must be present in the
// generated themes (the generator emits them into
// themes/index.css).
const REQUIRED_THEME_RULES = [
  ".ui-segmented-input:focus-visible + .ui-segmented-segment",
  ".ui-toggle:focus-visible .ui-toggle-track",
  ".ui-checkbox:focus-visible",
  '.ui-button[data-variant="primary"]:focus-visible',
];
const indexCssText = scannedFiles.find((f) => f.name === "index.css")?.text ?? "";
for (const selector of REQUIRED_THEME_RULES) {
  if (!indexCssText.includes(selector)) {
    censusFail(`themes/index.css: kit-owned focus rule missing: ${selector}`);
  }
}
// Border spends: every var(--ui-*) spent on a border
// property, per file, classified below as priced (by a
// Part 5a family) or decorative (with its reason).
const BORDER_SPENDS = {
  "AppShell.tsx|border-default": [
    "decorative",
    "shell dividers and frames — layout edges; regions are identified by surface and content",
  ],
  "Button.tsx|field-border": ["priced", "secondary variant's boundary — B1"],
  "Card.tsx|border-default": [
    "decorative",
    "card frame — the card is identified by its surface-2 ground, not its edge",
  ],
  "Checkbox.tsx|field-border": ["priced", "Checkbox/Radio unchecked boundary — B1"],
  "Checkbox.tsx|accent": ["priced", "Radio checked border — B2"],
  "Checkbox.tsx|status-ok": [
    "priced",
    "checked border, co-extensive with the checked fill; the state is identified by the white check on the fill — F3",
  ],
  "EmptyState.tsx|border-default": [
    "decorative",
    "dashed placeholder frame — the empty state is identified by its content",
  ],
  "Fields.tsx|field-border": ["priced", "field boundary at rest and on hover — B1"],
  "GroupedList.tsx|border-default": [
    "decorative",
    "list container frame and row dividers — layout hairlines",
  ],
  "GroupedList.tsx|status-fail": [
    "decorative",
    "NoticeRow tone border — a same-hue reinforcement edge on its own tint; the tone is identified by its priced status text, tint, and icon",
  ],
  "GroupedList.tsx|status-warn": [
    "decorative",
    "NoticeRow tone border — a same-hue reinforcement edge on its own tint; the tone is identified by its priced status text, tint, and icon",
  ],
  "SegmentedControl.tsx|field-border": ["priced", "checked segment's boundary — B1"],
  "Sheet.tsx|border-default": [
    "decorative",
    "panel frame — the panel is identified by its surface-3 ground and shadow",
  ],
  "Specimen.tsx|border-default": [
    "decorative",
    "review-harness frame — not a shipped control surface",
  ],
  "Toggle.tsx|field-border": ["priced", "off-state track boundary — B1"],
  "Toggle.tsx|accent": ["priced", "off-state hover border — B2"],
};
const borderSpendKeys = new Set();
for (const file of scannedFiles) {
  for (const line of file.text.split("\n")) {
    // Style-property form: a border property (never
    // borderRadius) whose value spends token(s).
    if (/border(?!Radius)[A-Za-z-]*\s*:/.test(line)) {
      for (const m of line.matchAll(/var\(--ui-([a-z-]+)\)/g)) {
        borderSpendKeys.add(`${file.name}|${m[1]}`);
      }
    }
    // Utility form: border-(--ui-…) (the var() shorthand).
    for (const m of line.matchAll(/border-\(--ui-([a-z-]+)\)/g)) {
      borderSpendKeys.add(`${file.name}|${m[1]}`);
    }
  }
}
for (const key of borderSpendKeys) {
  if (!(key in BORDER_SPENDS)) censusFail(`unclassified border spend: ${key}`);
}
for (const key of Object.keys(BORDER_SPENDS)) {
  if (!borderSpendKeys.has(key)) censusFail(`stale border-spend classification: ${key}`);
}

// Part 5b — composite grounds: component mix states,
// overlay stacks, and the highlight fills (see the
// header note). Text families hold the 4.5:1 bar,
// indicator families the 3:1 non-text bar, all fatal.
// The mix constants are mirrored gate data; the census
// below machine-checks them against the components.
const BUTTON_PRIMARY_ACTIVE_MIX_PCT = 88;
const BUTTON_DANGER_HOVER_MIX_PCT = 88;
const BUTTON_DANGER_ACTIVE_MIX_PCT = 78;
const SHEET_BACKDROP_MIX_PCT = 45;
const NOTICE_WARN_TINT_PCT = 20;
let mixChecked = 0;
let mixFailures = 0;
function checkMix(family, label, fgRgb, bgRgb) {
  const r = ratioRgb(fgRgb, bgRgb);
  mixChecked += 1;
  const ok = r >= 4.5;
  if (!ok) mixFailures += 1;
  if (verbose || !ok) {
    console.log(
      `${ok ? "PASS" : "FAIL"} [${family}] ${label}: ` +
        `${rgbToHex(fgRgb)} on ${rgbToHex(bgRgb)}: ${r.toFixed(2)}:1`,
    );
  }
}
let mixNtChecked = 0;
let mixNtFailures = 0;
function checkMixNT(family, label, fgRgb, bgRgb) {
  const r = ratioRgb(fgRgb, bgRgb);
  mixNtChecked += 1;
  const ok = r >= NON_TEXT_BAR;
  if (!ok) mixNtFailures += 1;
  if (verbose || !ok) {
    console.log(
      `${ok ? "PASS" : "FAIL"} [${family}] ${label}: ` +
        `${rgbToHex(fgRgb)} on ${rgbToHex(bgRgb)}: ${r.toFixed(2)}:1`,
    );
  }
}
// An rgba() token literal (accent-soft, the highlight
// fills) parsed to its channels + alpha; the composite
// over a ground is the same per-channel blend as a
// color-mix at the alpha's percentage.
function parseRgba(raw) {
  const m = raw.match(/rgba?\(([^)]+)\)/);
  if (!m) throw new Error(`cannot parse rgba value: ${raw}`);
  const parts = m[1].split(",").map((s) => parseFloat(s));
  return { rgb: parts.slice(0, 3), a: parts[3] ?? 1 };
}
const semRgba = (palette, mode, path) => {
  let node = tokens.semantic[palette][mode];
  for (const part of path.split(".")) node = node[part];
  // resolveSemantic stops at hex literals; an rgba()
  // literal is followed here (through any DTCG alias).
  let v = node.$value;
  while (typeof v === "string" && v.startsWith("{")) {
    let target = tokens;
    for (const part of v.slice(1, -1).split(".")) target = target[part];
    v = target.$value;
  }
  return parseRgba(v);
};
const overRgba = (rgba, bgRgb) => mixRgb(rgba.rgb, rgba.a * 100, bgRgb);

// M1/M2 — Button's mix states: the fill mixed toward
// the press-shade role at the mirrored percentages,
// priced as a text ground (on-accent, M1) and as the
// separator band's ground (on-accent, M2).
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const onAccent = hexToRgb(semHex(palette, mode, "on-accent"));
    const press = hexToRgb(semHex(palette, mode, "press-shade"));
    const states = [
      ["primary-active", semHex(palette, mode, "accent"), BUTTON_PRIMARY_ACTIVE_MIX_PCT],
      ["danger-hover", semHex(palette, mode, "danger"), BUTTON_DANGER_HOVER_MIX_PCT],
      ["danger-active", semHex(palette, mode, "danger"), BUTTON_DANGER_ACTIVE_MIX_PCT],
    ];
    for (const [state, fillHex, pct] of states) {
      const comp = mixRgb(hexToRgb(fillHex), pct, press);
      checkMix("M1", `on-accent on Button ${state} mix ${pct}% / ${palette}/${mode}`, onAccent, comp);
      checkMixNT("M2", `separator on-accent on Button ${state} mix ${pct}% / ${palette}/${mode}`, onAccent, comp);
    }
  }
}
// M3 — accent-soft grounds: content primary and
// secondary on the accent-soft composite over every
// surface.
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const soft = semRgba(palette, mode, "accent-soft");
    for (const voice of ["primary", "secondary"]) {
      const text = hexToRgb(contentHex(palette, mode, voice));
      for (const surface of SURFACES) {
        checkMix(
          "M3",
          `content-${voice} on accent-soft / ${palette}/${mode}/surface-${surface}`,
          text,
          overRgba(soft, hexToRgb(surfaceHex(palette, mode, surface))),
        );
      }
    }
  }
}
// M4 — the AppShell hot-count stack: the fail badge's
// mix text on its tint over accent-soft over surface-1
// (the SidebarNav ground — see the header note).
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const hue = hexToRgb(resolveColor(tokens.status.fail.hue.$value, mode));
    const primary = hexToRgb(contentHex(palette, mode, "primary"));
    const text = mixRgb(hue, BADGE_FG_HUE_PCT, primary);
    const soft = semRgba(palette, mode, "accent-soft");
    const ground = overRgba(soft, hexToRgb(surfaceHex(palette, mode, "1")));
    checkMix(
      "M4",
      `fail badge text on tint ${BADGE_TINT_PCT}% over accent-soft / ${palette}/${mode}/surface-1`,
      text,
      mixRgb(hue, BADGE_TINT_PCT, ground),
    );
  }
}
// M5 — the NoticeRow warn blend: warn text on the
// warn hue mixed into surface-2 at the mirrored
// percentage (the fail blend is Part 3 family C).
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const hue = hexToRgb(resolveColor(tokens.status.warn.hue.$value, mode));
    const text = hexToRgb(resolveColor(tokens.status.warn.text[mode].$value, mode));
    const s2 = hexToRgb(surfaceHex(palette, mode, "2"));
    checkMix(
      "M5",
      `warn text on NoticeRow blend ${NOTICE_WARN_TINT_PCT}% / ${palette}/${mode}`,
      text,
      mixRgb(hue, NOTICE_WARN_TINT_PCT, s2),
    );
  }
}
// M6 — the highlight fills under content text: content
// primary and secondary on the selection/annotation
// fill composites over every surface. (Muted is not a
// priced voice on a fill — see the header note.)
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    for (const fillName of ["selection-fill", "annotation-fill"]) {
      const fill = semRgba(palette, mode, `highlight.${fillName}`);
      for (const voice of ["primary", "secondary"]) {
        const text = hexToRgb(contentHex(palette, mode, voice));
        for (const surface of SURFACES) {
          checkMix(
            "M6",
            `content-${voice} on ${fillName} / ${palette}/${mode}/surface-${surface}`,
            text,
            overRgba(fill, hexToRgb(surfaceHex(palette, mode, surface))),
          );
        }
      }
    }
  }
}
// M7 — the highlight bars as indicators: each bar
// against every surface, and against its own fill
// composited over every surface.
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    for (const kind of ["selection", "annotation"]) {
      const bar = hexToRgb(semHex(palette, mode, `highlight.${kind}-bar`));
      const fill = semRgba(palette, mode, `highlight.${kind}-fill`);
      for (const surface of SURFACES) {
        const bg = hexToRgb(surfaceHex(palette, mode, surface));
        checkMixNT("M7", `${kind}-bar on surface-${surface} / ${palette}/${mode}`, bar, bg);
        checkMixNT(
          "M7",
          `${kind}-bar on own fill / ${palette}/${mode}/surface-${surface}`,
          bar,
          overRgba(fill, bg),
        );
      }
    }
  }
}

// Part 5b census — every color-mix spend in the tree,
// scanned at gate time over the same files as Part
// 5a's census. Each spend is classified below as
// priced by a named family or classified with its
// reason; the per-file occurrence count must match
// the classifications, and each classification's
// needle must still be present (a vanished spend
// makes its classification stale — itself a finding).
const COLOR_MIX_SPENDS = [
  { file: "Button.tsx", needle: "var(--ui-accent) ${BUTTON_PRIMARY_ACTIVE_MIX_PCT}%", as: "priced — M1/M2 (primary-active mix)" },
  { file: "Button.tsx", needle: "var(--ui-danger) ${BUTTON_DANGER_HOVER_MIX_PCT}%", as: "priced — M1/M2 (danger-hover mix)" },
  { file: "Button.tsx", needle: "var(--ui-danger) ${BUTTON_DANGER_ACTIVE_MIX_PCT}%", as: "priced — M1/M2 (danger-active mix)" },
  { file: "GroupedList.tsx", needle: "var(--ui-status-fail) ${NOTICE_FAIL_TINT_PCT}%", as: "priced — Part 3 family C (NoticeRow fail blend)" },
  { file: "GroupedList.tsx", needle: "var(--ui-status-warn) ${NOTICE_WARN_TINT_PCT}%", as: "priced — M5 (NoticeRow warn blend)" },
  { file: "Badge.tsx", needle: "${hue} ${BADGE_TINT_PCT}%", as: "priced — Part 3 family B (badge tint ground)" },
  { file: "Badge.tsx", needle: "${hue} ${BADGE_FG_HUE_PCT}%", as: "priced — Part 3 family B (badge text mix); the fail tone's stack is M4" },
  { file: "StatusChip.tsx", needle: "CHIP_PRESSED_TINT_PCT : CHIP_TINT_PCT", as: "priced — Part 3 family A (chip tints, rest 14% / pressed 22%)" },
  { file: "AppShell.tsx", needle: "var(--ui-status-fail) ${BADGE_TINT_PCT}%", as: "priced — Part 3 family B; on the active nav row the stack is M4" },
  { file: "AppShell.tsx", needle: "var(--ui-status-fail) ${BADGE_FG_HUE_PCT}%", as: "priced — Part 3 family B; on the active nav row the stack is M4" },
  {
    file: "Sheet.tsx",
    needle: "var(--ui-content-primary) ${SHEET_BACKDROP_MIX_PCT}%",
    as: "classified — the backdrop composite carries no text and no text pair over it is well-formed: the dismiss control is aria-labelled only (no visible glyph), the panel it serves is opaque surface-3 (its text is priced in Parts 1-2), and the page behind an aria-modal sheet is deliberately obscured and inert — subordination is the composite's job, so no pair is invented for it",
  },
];
let mixCensusFailures = 0;
function mixCensusFail(label) {
  mixCensusFailures += 1;
  console.log(`FAIL [census-5b] ${label}`);
}
let mixSpendsClassified = 0;
for (const file of scannedFiles) {
  const found = (file.text.match(/color-mix\(/g) || []).length;
  const expected = COLOR_MIX_SPENDS.filter((c) => c.file === file.name);
  if (found !== expected.length) {
    mixCensusFail(
      `${file.name}: ${found} color-mix spend(s), ${expected.length} classification(s)`,
    );
  }
  for (const c of expected) {
    if (!file.text.includes(c.needle)) {
      mixCensusFail(`${file.name}: stale color-mix classification (needle not found)`);
    } else {
      mixSpendsClassified += 1;
      if (verbose) console.log(`PASS [census-5b] ${file.name}: color-mix ${c.as}`);
    }
  }
}
// The mirrored constants, machine-checked against the
// components' exported values: a component that
// changes its constant without this gate fails here.
const MIRRORED_CONSTANTS = {
  BUTTON_PRIMARY_ACTIVE_MIX_PCT,
  BUTTON_DANGER_HOVER_MIX_PCT,
  BUTTON_DANGER_ACTIVE_MIX_PCT,
  SHEET_BACKDROP_MIX_PCT,
  NOTICE_WARN_TINT_PCT,
  BADGE_TINT_PCT,
  BADGE_FG_HUE_PCT,
};
const componentText = scannedFiles.map((f) => f.text).join("\n");
for (const [name, value] of Object.entries(MIRRORED_CONSTANTS)) {
  const m = componentText.match(new RegExp(`export const ${name} = (\\d+);`));
  if (!m) {
    mixCensusFail(`mirrored constant ${name}: no component export found`);
  } else if (Number(m[1]) !== value) {
    mixCensusFail(
      `mirrored constant ${name}: components export ${m[1]}, the gate declares ${value}`,
    );
  }
}

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
