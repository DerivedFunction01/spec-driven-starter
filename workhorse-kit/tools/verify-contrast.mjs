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
// Part 2 (scanner rule 1 of the 2026-11-10 entries critic
// pass): the CONTENT tokens join the net. --wb-content-
// primary and --wb-content-secondary are the essential-
// content voices and must hold >= 4.5:1 against every
// surface token, both palettes x both modes — that bar is
// FATAL. --wb-content-muted is the META voice (slugs,
// timestamps, counts, card meta lines): the 2026-11-16
// superapp critic pass (finding B-2) measured it at
// 2.91–3.71:1 across the surface set and filed it as a
// serious WCAG 2.2 AA failure on 4,229 rendered nodes, so
// the meta-only 3.4:1 grading recorded here in 2026-11-10
// is superseded: muted now holds the SAME fatal 4.5:1 bar
// on every surface, both palettes x both modes, and its
// token values sit on the muted->secondary scale step that
// clears the bar while staying the subordinate voice.
//
// Part 3 (2026-11-16 superapp critic re-run, finding
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
// Part 4 (2026-11-16 superapp critic confirmation,
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
// Part 5 (2026-11-17 superapp critic confirmation
// follow-up — the Button danger active state F9 measured
// at 3.92:1 olive/dark and 3.67:1 teal/dark and named
// outside its scope): the BUTTON STATE pairs join the
// net. Button (components/Button.tsx) paints its primary
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
// Part 6 (2026-11-17, the generic-kit sync — Step 7 of
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
//      2026-11-16 critic confirmation pass read as
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
// decorative with its reason, or — one entry —
// provisional: Button's secondary boundary, whose
// re-point is owed by the in-flight Button cure that
// owns that file; the census prints it as a NOTE on
// every run until the spend moves), and every
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

// Resolve a status text $value to a hex: literal, a DTCG
// alias into primitive/status, or a var(--wb-status-*-text)
// reference to another status's same-mode text.
function resolveText(raw, mode, seen = new Set()) {
  if (raw.startsWith("#")) return raw;
  const alias = raw.match(/^var\(--wb-status-([a-z-]+)-text\)$/);
  if (alias) {
    if (seen.has(alias[1])) throw new Error(`alias loop: ${raw}`);
    seen.add(alias[1]);
    return resolveText(tokens.status[alias[1]].text[mode].$value, mode, seen);
  }
  const dtcg = raw.match(/^\{(.+)\}$/);
  if (dtcg) {
    let node = tokens;
    for (const part of dtcg[1].split(".")) node = node[part];
    return resolveText(node.$value, mode, seen);
  }
  throw new Error(`cannot resolve status text value: ${raw}`);
}

let failures = 0;
let checked = 0;
for (const [name, st] of Object.entries(tokens.status)) {
  if (name === "chart") continue;
  for (const mode of ["light", "dark"]) {
    const text = resolveText(st.text[mode].$value, mode);
    for (const palette of Object.keys(tokens.semantic)) {
      for (const surface of SURFACES) {
        const bg = tokens.semantic[palette][mode].surface[surface].$value;
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
// Part 2 — content tokens x surfaces (scanner rule 1).
// Every content voice — primary, secondary, and muted —
// holds the AA bar (4.5:1) on every surface, fatally.
// Muted joined the fatal set under the 2026-11-16 critic
// finding B-2 (see the header note).
const CONTENT_VOICES = ["primary", "secondary", "muted"];
let contentChecked = 0;
let contentFailures = 0;
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const content = tokens.semantic[palette][mode].content;
    for (const voice of CONTENT_VOICES) {
      const text = content[voice].$value;
      for (const surface of SURFACES) {
        const bg = tokens.semantic[palette][mode].surface[surface].$value;
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

// Part 3 — text on status tints (finding N-1; see the
// header note). A tint is color-mix(hue, N%, transparent)
// composited over the surface beneath, so the rendered
// background is the per-channel blend of the hue at N%
// with that surface; a mix of two opaque colours is the
// same blend without the surface step.
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
// Resolve a status hue $value to a hex: literal, a DTCG
// alias into the primitives, a var(--wb-status-<other>)
// reference to another status's hue, or deferred's
// var(--wb-content-secondary) (the palette/mode's own
// secondary content token).
function resolveHue(raw, palette, mode, seen = new Set()) {
  if (raw.startsWith("#")) return raw;
  if (raw === "var(--wb-content-secondary)") {
    return tokens.semantic[palette][mode].content.secondary.$value;
  }
  const alias = raw.match(/^var\(--wb-status-([a-z-]+)\)$/);
  if (alias) {
    if (seen.has(alias[1])) throw new Error(`hue alias loop: ${raw}`);
    seen.add(alias[1]);
    return resolveHue(tokens.status[alias[1]].hue.$value, palette, mode, seen);
  }
  const dtcg = raw.match(/^\{(.+)\}$/);
  if (dtcg) {
    let node = tokens;
    for (const part of dtcg[1].split(".")) node = node[part];
    return resolveHue(node.$value, palette, mode, seen);
  }
  throw new Error(`cannot resolve status hue value: ${raw}`);
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

// A — status text on its own hue's tint (Chip 14% rest /
// 22% pressed; StatusChip, Badge, Lane ride the 14% step).
for (const [name, st] of Object.entries(tokens.status)) {
  if (name === "chart") continue;
  for (const mode of ["light", "dark"]) {
    const text = hexToRgb(resolveText(st.text[mode].$value, mode));
    for (const palette of Object.keys(tokens.semantic)) {
      const hue = hexToRgb(resolveHue(st.hue.$value, palette, mode));
      for (const surface of SURFACES) {
        const bg = hexToRgb(tokens.semantic[palette][mode].surface[surface].$value);
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
// A2 — content voices on the stale tint (DegradedBanner,
// StateControls FieldError: primary message, secondary
// detail, on color-mix(stale hue, 14%, transparent)).
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const hue = hexToRgb(resolveHue(tokens.status.stale.hue.$value, palette, mode));
    for (const voice of ["primary", "secondary"]) {
      const text = hexToRgb(tokens.semantic[palette][mode].content[voice].$value);
      for (const surface of SURFACES) {
        const bg = hexToRgb(tokens.semantic[palette][mode].surface[surface].$value);
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
// B — the mix badges (LogRow KindBadge tones, AppShell
// hot CountBadge): text = color-mix(hue, FG%, the
// palette/mode's content-primary) on the hue's tint.
// The percentages are the components' constants,
// mirrored here (see the header note).
const BADGE_TINT_PCT = 16;
const BADGE_FG_HUE_PCT = 43;
const BADGE_TONES = {
  ok: "{primitive.color.okabe.bluish-green}",
  info: "{primitive.color.okabe.blue}",
  warn: "{primitive.color.okabe.orange}",
  fail: "{primitive.color.okabe.vermilion}",
};
for (const [tone, ref] of Object.entries(BADGE_TONES)) {
  const hue = hexToRgb(resolveHue(ref, "olive", "light"));
  for (const palette of Object.keys(tokens.semantic)) {
    for (const mode of ["light", "dark"]) {
      const primary = hexToRgb(tokens.semantic[palette][mode].content.primary.$value);
      const text = mixRgb(hue, BADGE_FG_HUE_PCT, primary);
      for (const surface of SURFACES) {
        const bg = hexToRgb(tokens.semantic[palette][mode].surface[surface].$value);
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
// surface-2 (an opaque blend, not a transparent tint).
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const s2 = hexToRgb(tokens.semantic[palette][mode].surface["2"].$value);
    const hgHue = hexToRgb(resolveHue(tokens.status["hard-gate"].hue.$value, palette, mode));
    const hgText = hexToRgb(resolveText(tokens.status["hard-gate"].text[mode].$value, mode));
    checkTint(
      "C",
      `hard-gate text on mix(hue 12%, surface-2) / ${palette}/${mode}`,
      hgText,
      mixRgb(hgHue, 12, s2),
    );
    const orange = hexToRgb(resolveHue("{primitive.color.okabe.orange}", palette, mode));
    const staleText = hexToRgb(resolveText(tokens.status.stale.text[mode].$value, mode));
    checkTint(
      "C",
      `stale text on mix(orange 20%, surface-2) / ${palette}/${mode}`,
      staleText,
      mixRgb(orange, 20, s2),
    );
  }
}

// Part 4 — text on solid fills (finding F-2; see the
// header note). The fills are opaque, so the pair is the
// whole story: the fill token and its on- token, read
// straight from the semantic tokens (DTCG aliases
// resolved), per palette x mode.
function resolveSemantic(raw) {
  let v = raw;
  while (typeof v === "string" && v.startsWith("{")) {
    let node = tokens;
    for (const part of v.slice(1, -1).split(".")) node = node[part];
    v = node.$value;
  }
  return v;
}
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
      resolveSemantic(sem["on-notify"].$value),
      resolveSemantic(sem.notify.$value),
    );
    for (const fill of ["accent", "accent-hover", "danger"]) {
      checkSolid(
        `on-accent on ${fill} / ${palette}/${mode}`,
        resolveSemantic(sem["on-accent"].$value),
        resolveSemantic(sem[fill].$value),
      );
    }
  }
}

// Part 5 — Button state pairs (see the header note).
// The component's state mixes, mirrored as data:
// primary active = accent at BTN_PRIMARY_ACTIVE_PCT
// toward the shade endpoint; danger hover = danger at
// BTN_DANGER_HOVER_PCT; danger active = danger at
// BTN_DANGER_ACTIVE_PCT. Rest and primary-hover states
// are the plain tokens (already in Part 4's net as
// pairs; they repeat here so the family reads whole, as
// the component defines it).
const BTN_PRIMARY_ACTIVE_PCT = 88;
const BTN_DANGER_HOVER_PCT = 88;
const BTN_DANGER_ACTIVE_PCT = 78;
// The component's mix endpoint: the press-shade token
// (black in light modes, white in dark), resolved per
// palette x mode in the loop below, the way Part 4
// resolves its pairs. The step direction is the
// token's, per mode — the same discipline as
// accent-hover, which steps darker under white text and
// lighter under dark text. A fixed step toward black
// spends the dark modes' contrast against their own
// dark on-accent text: at the uncured endpoint the
// danger active state (78% toward black) measured
// 3.92:1 olive/dark and 3.67:1 teal/dark — the failure
// this part was added to pin (see gate-red in the F9b
// evidence) — and danger hover cleared the bar by only
// 0.03 in teal/dark.
let buttonChecked = 0;
let buttonFailures = 0;
function checkButton(label, fgRgb, bgRgb) {
  const r = ratioRgb(fgRgb, bgRgb);
  buttonChecked += 1;
  const ok = r >= 4.5;
  if (!ok) buttonFailures += 1;
  if (verbose || !ok) {
    console.log(
      `${ok ? "PASS" : "FAIL"} [button] ${label}: ` +
        `${rgbToHex(fgRgb)} on ${rgbToHex(bgRgb)}: ${r.toFixed(2)}:1`,
    );
  }
}
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const sem = tokens.semantic[palette][mode];
    const onAccent = hexToRgb(resolveSemantic(sem["on-accent"].$value));
    const shade = hexToRgb(resolveSemantic(sem["press-shade"].$value));
    const accent = hexToRgb(resolveSemantic(sem.accent.$value));
    const danger = hexToRgb(resolveSemantic(sem.danger.$value));
    const states = [
      ["primary rest", accent],
      ["primary hover", hexToRgb(resolveSemantic(sem["accent-hover"].$value))],
      ["primary active", mixRgb(accent, BTN_PRIMARY_ACTIVE_PCT, shade)],
      ["danger rest", danger],
      ["danger hover", mixRgb(danger, BTN_DANGER_HOVER_PCT, shade)],
      ["danger active", mixRgb(danger, BTN_DANGER_ACTIVE_PCT, shade)],
    ];
    for (const [label, fill] of states) {
      checkButton(`on-accent on ${label} / ${palette}/${mode}`, onAccent, fill);
    }
  }
}

// Part 6 — non-text pairs, composite grounds, and the
// spend census (see the header note). Non-text families
// hold the WCAG non-text 3:1; composite text families
// hold the same fatal 4.5:1 as Parts 1–5.
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
let mix6Checked = 0;
let mix6Failures = 0;
function checkMix6(family, label, fgRgb, bgRgb) {
  const r = ratioRgb(fgRgb, bgRgb);
  mix6Checked += 1;
  const ok = r >= 4.5;
  if (!ok) mix6Failures += 1;
  if (verbose || !ok) {
    console.log(
      `${ok ? "PASS" : "FAIL"} [${family}] ${label}: ` +
        `${rgbToHex(fgRgb)} on ${rgbToHex(bgRgb)}: ${r.toFixed(2)}:1`,
    );
  }
}
// Semantic helpers in a palette x mode scope (Part 4's
// resolveSemantic follows the DTCG aliases; an rgba()
// literal is a value, not an alias, and passes through).
const semHex6 = (palette, mode, path) => {
  let node = tokens.semantic[palette][mode];
  for (const part of path.split(".")) node = node[part];
  return resolveSemantic(node.$value);
};
const surfHex6 = (palette, mode, surface) =>
  tokens.semantic[palette][mode].surface[surface].$value;
function parseRgba(raw) {
  const m = raw.match(/rgba?\(([^)]+)\)/);
  if (!m) throw new Error(`cannot parse rgba value: ${raw}`);
  const parts = m[1].split(",").map((s) => parseFloat(s));
  return { rgb: parts.slice(0, 3), a: parts[3] ?? 1 };
}
const semRgba6 = (palette, mode, path) => {
  let node = tokens.semantic[palette][mode];
  for (const part of path.split(".")) node = node[part];
  return parseRgba(resolveSemantic(node.$value));
};
const overRgba = (rgba, bgRgb) => mixRgb(rgba.rgb, rgba.a * 100, bgRgb);

// F1 — focus-ring x every surface.
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const focus = semHex6(palette, mode, "focus-ring");
    for (const surface of SURFACES) {
      checkNT(
        "F1",
        `focus-ring on surface-${surface} / ${palette}/${mode}`,
        ratio(focus, surfHex6(palette, mode, surface)),
      );
    }
  }
}
// F2 — focus-ring x tint grounds: status tints at
// 14%/22% over every surface (the pressable chip's ring
// ground), and the NoticeRow opaque blends into
// surface-2 (hard-gate 12%, orange 20%).
for (const [name, st] of Object.entries(tokens.status)) {
  if (name === "chart") continue;
  for (const mode of ["light", "dark"]) {
    for (const palette of Object.keys(tokens.semantic)) {
      const hue = hexToRgb(resolveHue(st.hue.$value, palette, mode));
      const focus = hexToRgb(semHex6(palette, mode, "focus-ring"));
      for (const surface of SURFACES) {
        const bg = hexToRgb(surfHex6(palette, mode, surface));
        for (const pct of [14, 22]) {
          checkNT(
            "F2",
            `focus-ring on status-${name} tint ${pct}% / ${palette}/${mode}/surface-${surface}`,
            ratioRgb(focus, mixRgb(hue, pct, bg)),
          );
        }
      }
    }
  }
}
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const focus = hexToRgb(semHex6(palette, mode, "focus-ring"));
    const s2 = hexToRgb(surfHex6(palette, mode, "2"));
    const hgHue = hexToRgb(resolveHue(tokens.status["hard-gate"].hue.$value, palette, mode));
    checkNT(
      "F2",
      `focus-ring on NoticeRow hard-gate blend 12% / ${palette}/${mode}`,
      ratioRgb(focus, mixRgb(hgHue, 12, s2)),
    );
    const orange = hexToRgb(resolveHue("{primitive.color.okabe.orange}", palette, mode));
    checkNT(
      "F2",
      `focus-ring on NoticeRow orange blend 20% / ${palette}/${mode}`,
      ratioRgb(focus, mixRgb(orange, 20, s2)),
    );
  }
}
// F3 — the separator pairs: the inset band a solid-fill
// focusable carries, priced against its fill. on-accent
// against the accent-family fills (the Toggle's checked
// track, rest and hover); white — the Checkbox's check
// colour, a constant in the generator's theme rule —
// against the done hue (the checked disc's fill).
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const onAccent = semHex6(palette, mode, "on-accent");
    for (const fill of ["accent", "accent-hover"]) {
      checkNT(
        "F3",
        `separator on-accent on ${fill} / ${palette}/${mode}`,
        ratio(onAccent, semHex6(palette, mode, fill)),
      );
    }
    const doneHue = resolveHue(tokens.status.done.hue.$value, palette, mode);
    checkNT("F3", `separator white on done fill / ${palette}/${mode}`, ratio("#ffffff", doneHue));
  }
}
// B1 — field-border role x every surface: the priced
// boundary for Fields (the shared FIELD_STYLE),
// PaletteSelect, Checkbox/Radio unchecked, the Toggle
// off-state track, and the segmented controls' checked
// segment (whose grounds are the sunken track and its
// surface-2 fill — both in the surface set).
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const field = semHex6(palette, mode, "field-border");
    for (const surface of SURFACES) {
      checkNT(
        "B1",
        `field-border on surface-${surface} / ${palette}/${mode}`,
        ratio(field, surfHex6(palette, mode, surface)),
      );
    }
  }
}
// B2 — the accent border spends that stay (Radio
// checked; Toggle off-state hover; the accented Lane's
// left bar): the accent against every surface.
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const accent = semHex6(palette, mode, "accent");
    for (const surface of SURFACES) {
      checkNT(
        "B2",
        `accent border on surface-${surface} / ${palette}/${mode}`,
        ratio(accent, surfHex6(palette, mode, surface)),
      );
    }
  }
}
// M3 — accent-soft grounds: content primary on the
// accent-soft composite over every surface (the
// AppShell active nav row's label).
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const soft = semRgba6(palette, mode, "accent-soft");
    const text = hexToRgb(semHex6(palette, mode, "content.primary"));
    for (const surface of SURFACES) {
      checkMix6(
        "M3",
        `content-primary on accent-soft / ${palette}/${mode}/surface-${surface}`,
        text,
        overRgba(soft, hexToRgb(surfHex6(palette, mode, surface))),
      );
    }
  }
}
// M4 — the AppShell hot-count stack: the vermilion
// badge's mix text on its tint over accent-soft over
// surface-1 (the SidebarNav ground — see the header
// note). The badge percentages are Part 3 family B's
// mirrored constants.
const VERMILION_RGB = hexToRgb(resolveHue("{primitive.color.okabe.vermilion}", "olive", "light"));
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const primary = hexToRgb(semHex6(palette, mode, "content.primary"));
    const text = mixRgb(VERMILION_RGB, BADGE_FG_HUE_PCT, primary);
    const soft = semRgba6(palette, mode, "accent-soft");
    const ground = overRgba(soft, hexToRgb(surfHex6(palette, mode, "1")));
    checkMix6(
      "M4",
      `hot badge text on tint ${BADGE_TINT_PCT}% over accent-soft / ${palette}/${mode}/surface-1`,
      text,
      mixRgb(VERMILION_RGB, BADGE_TINT_PCT, ground),
    );
  }
}
// M6 — the highlight fills under text: content primary
// on the selection/annotation fill composites over
// every surface (the AnnotationBadge marks).
for (const palette of Object.keys(tokens.semantic)) {
  for (const mode of ["light", "dark"]) {
    const text = hexToRgb(semHex6(palette, mode, "content.primary"));
    for (const fillName of ["selection-fill", "annotation-fill"]) {
      const fill = semRgba6(palette, mode, `highlight.${fillName}`);
      for (const surface of SURFACES) {
        checkMix6(
          "M6",
          `content-primary on ${fillName} / ${palette}/${mode}/surface-${surface}`,
          text,
          overRgba(fill, hexToRgb(surfHex6(palette, mode, surface))),
        );
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
      const bar = hexToRgb(semHex6(palette, mode, `highlight.${kind}-bar`));
      const fill = semRgba6(palette, mode, `highlight.${kind}-fill`);
      for (const surface of SURFACES) {
        const bg = hexToRgb(surfHex6(palette, mode, surface));
        checkNT("M7", `${kind}-bar on surface-${surface} / ${palette}/${mode}`, ratioRgb(bar, bg));
        checkNT(
          "M7",
          `${kind}-bar on own fill / ${palette}/${mode}/surface-${surface}`,
          ratioRgb(bar, overRgba(fill, bg)),
        );
      }
    }
  }
}

// Part 6 census — spends scanned from the tree at gate
// time (see the header note). Classifications are gate
// data; the scan itself is generated, never listed.
const kitRoot6 = join(here, "..");
function scanDir6(dir, exts) {
  return readdirSync(join(kitRoot6, dir))
    .filter((f) => exts.some((e) => f.endsWith(e)))
    .sort()
    .map((f) => ({ name: f, text: readFileSync(join(kitRoot6, dir, f), "utf8") }));
}
const componentFiles6 = scanDir6("components", [".tsx"]);
const indexCss6 = readFileSync(join(kitRoot6, "themes", "index.css"), "utf8");
let censusFailures6 = 0;
function censusFail6(label) {
  censusFailures6 += 1;
  console.log(`FAIL [census] ${label}`);
}
// Focus spends: every focus outline, in the components
// and in the kit-owned theme rules, spends the
// focus-ring role and no other token.
let focusSpends6 = 0;
for (const file of componentFiles6) {
  focusSpends6 += (file.text.match(/outline-\(--wb-focus-ring\)/g) || []).length;
  for (const m of file.text.matchAll(/outline-\(--wb-([a-z-]+)\)/g)) {
    if (m[1] !== "focus-ring") {
      censusFail6(`${file.name}: a focus outline spends --wb-${m[1]}, not the focus-ring role`);
    }
  }
  for (const m of file.text.matchAll(/outline[^;\n"]*?var\(--wb-([a-z-]+)\)/g)) {
    if (m[1] !== "focus-ring") {
      censusFail6(`${file.name}: a focus outline spends --wb-${m[1]}, not the focus-ring role`);
    }
  }
}
focusSpends6 += (indexCss6.match(/outline: 2px solid var\(--wb-focus-ring\)/g) || []).length;
if (focusSpends6 === 0) censusFail6("no focus spends found — the census is blind");
// The kit-owned focus rules must be present in the
// generated themes (the generator emits them into
// themes/index.css).
const REQUIRED_THEME_RULES6 = [
  ".wb-segmented-input:focus-visible + .wb-segmented-segment",
  ".wb-toggle:focus-visible .wb-toggle-track",
  ".wb-checkbox:focus-visible",
];
for (const selector of REQUIRED_THEME_RULES6) {
  if (!indexCss6.includes(selector)) {
    censusFail6(`themes/index.css: kit-owned focus rule missing: ${selector}`);
  }
}
// outline-none: each occurrence must be classified
// here, compensated by the named mechanism; a
// classification whose spend vanished is stale and
// itself a finding.
const OUTLINE_NONE6 = [
  {
    file: "Chip.tsx",
    needle: "justify-center border-0 bg-transparent p-0 focus-visible:outline-none",
    by: "group ring on the pill span (group-focus-visible outline utilities spending the focus-ring role)",
  },
  {
    file: "LogRow.tsx",
    needle: "relative focus-visible:outline-none",
    by: "the drawer panel is a programmatic focus target (tabIndex -1), not an operable control — the panel's own appearance (surface-2 + shadow over the backdrop) is the indication, and every operable control inside carries its own ring",
  },
  {
    file: "Sheet.tsx",
    needle: "max-w-[480px] flex-col focus-visible:outline-none",
    by: "the panel is a programmatic focus target (tabIndex -1), not an operable control — the panel's own appearance (surface-3 + shadow over the backdrop) is the indication, and every operable control inside carries its own ring",
  },
  {
    file: "Toggle.tsx",
    needle: "wb-toggle group inline-flex",
    by: "group ring on the track span (group-focus-visible outline utilities) + the kit theme rule .wb-toggle:focus-visible .wb-toggle-track, whose inset on-accent separator band is priced in F3",
  },
];
let outlineNoneCount6 = 0;
for (const file of componentFiles6) {
  const found = (file.text.match(/outline-none/g) || []).length;
  outlineNoneCount6 += found;
  const expected = OUTLINE_NONE6.filter((c) => c.file === file.name);
  if (found !== expected.length) {
    censusFail6(
      `${file.name}: ${found} outline-none occurrence(s), ${expected.length} classification(s)`,
    );
  }
  for (const c of expected) {
    if (!file.text.includes(c.needle)) {
      censusFail6(`${file.name}: stale outline-none classification (needle not found)`);
    } else if (verbose) {
      console.log(`PASS [census] ${file.name}: outline-none compensated by ${c.by}`);
    }
  }
}
// Border spends: every var(--wb-*) spent on a border
// property, per file, classified below as priced (by a
// Part 6 family), decorative (with its reason), or
// provisional (one entry: a re-point owed by another
// programme's in-flight cure, printed as a NOTE on
// every run until the spend moves). A hue spent through
// a `var(--wb-status-${…})` template is keyed
// status-<dynamic>.
const BORDER_SPENDS6 = {
  "AnnotationBadge.tsx|status-<dynamic>": [
    "decorative",
    "outline pill in the status hue on a transparent ground — the badge is identified by its priced status text and glyph; the hue edge is same-hue reinforcement",
  ],
  "AppShell.tsx|border-default": [
    "decorative",
    "shell frames and dividers (sidebar edge, panel frames, row separators) — layout edges; regions are identified by surface and content",
  ],
  "Badge.tsx|status-<dynamic>": [
    "decorative",
    "outline pill in the status hue on a transparent ground — the badge is identified by its priced status text and glyph; the hue edge is same-hue reinforcement",
  ],
  "Button.tsx|border-strong": [
    "provisional",
    "the secondary variant's boundary — the variant's only edge, and border-strong measures 1.66–1.83:1 on its grounds. Button.tsx carries another programme's in-flight cure and is not edited by this sync; the re-point to field-border is owed by that landing, and this entry retires the run it lands",
  ],
  "Card.tsx|border-default": [
    "decorative",
    "card frame — the card is identified by its surface-2 ground, not its edge",
  ],
  "Checkbox.tsx|accent": ["priced", "Radio checked border — B2"],
  "Checkbox.tsx|field-border": ["priced", "Checkbox/Radio unchecked boundary — B1"],
  "Checkbox.tsx|status-done": [
    "priced",
    "checked border, co-extensive with the checked fill; the state is identified by the white check on the fill — F3",
  ],
  "Chip.tsx|status-<dynamic>": [
    "decorative",
    "the pressable chip's hue edge on its own tint — same-hue reinforcement; the chip is identified by its priced status text, glyph, and dot, and its pressed state by the 22% tint priced in Part 3",
  ],
  "DataTable.tsx|border-default": ["decorative", "row dividers — table grammar hairlines"],
  "DataTable.tsx|border-strong": [
    "decorative",
    "column-header rule — table grammar; columns are identified by their header text",
  ],
  "DegradedBanner.tsx|border-default": [
    "decorative",
    "banner frame in the neutral form — identified by its surface and content",
  ],
  "DegradedBanner.tsx|status-stale": [
    "decorative",
    "tone border, same-hue reinforcement on its own tint; the banner is identified by its priced content text (Part 3 A2) and glyph",
  ],
  "EmptyState.tsx|border-default": [
    "decorative",
    "dashed placeholder frame — the empty state is identified by its content",
  ],
  "Fields.tsx|field-border": ["priced", "field boundary (the shared FIELD_STYLE) — B1"],
  "Frame.tsx|border-default": [
    "decorative",
    "frame and well edges — layout frames identified by surface and content",
  ],
  "GroupedList.tsx|border-default": [
    "decorative",
    "list container frame and row dividers — layout hairlines",
  ],
  "GroupedList.tsx|okabe-orange": [
    "decorative",
    "NoticeRow stale tone border — same-hue reinforcement on its own blend, as the hard-gate entry",
  ],
  "GroupedList.tsx|status-hard-gate": [
    "decorative",
    "NoticeRow tone border — same-hue reinforcement on its own blend; the tone is identified by its priced status text, blend, and icon (Part 3 C)",
  ],
  "Lane.tsx|accent": ["priced", "the accented lane's 2px left bar — the emphasis marker — B2"],
  "Lane.tsx|border-default": [
    "decorative",
    "lane frame — the lane is identified by its surface-1 ground and heading",
  ],
  "LogRow.tsx|border-default": [
    "decorative",
    "entry frame and drawer row dividers — layout edges",
  ],
  "PaletteSelect.tsx|field-border": ["priced", "field boundary (the select form) — B1"],
  "SectionBoundary.tsx|border-default": [
    "decorative",
    "boundary frame — identified by its surface and content",
  ],
  "SegmentedControl.tsx|field-border": ["priced", "checked segment's boundary — B1"],
  "Sheet.tsx|border-default": [
    "decorative",
    "panel frame — the panel is identified by its surface-3 ground and shadow",
  ],
  "Specimen.tsx|border-default": [
    "decorative",
    "review-harness frames — not a shipped control surface",
  ],
  "StateControls.tsx|border-default": [
    "decorative",
    "section panel frame — identified by its surface-2 ground and heading",
  ],
  "StateControls.tsx|field-border": [
    "priced",
    "checked segment's boundary (the two-line option form) — B1",
  ],
  "StateControls.tsx|status-stale": [
    "decorative",
    "FieldError tone border — same-hue reinforcement on its own tint; the error is identified by its priced content text (Part 3 A2) and role=alert",
  ],
  "Toggle.tsx|accent": ["priced", "off-state hover border — B2"],
  "Toggle.tsx|field-border": ["priced", "off-state track boundary — B1"],
  "TriageRow.tsx|border-default": [
    "decorative",
    "row frame at rest — the row is identified by its surface-2 fill and content",
  ],
  "TriageRow.tsx|border-strong": [
    "decorative",
    "row frame on hover/active — the state is carried by the surface change (surface-1 / sunken), not the border step",
  ],
};
const borderSpendKeys6 = new Set();
for (const file of componentFiles6) {
  for (const line of file.text.split("\n")) {
    // Style-property form: a border property (never
    // borderRadius) whose value spends token(s).
    if (/border(?!Radius)[A-Za-z-]*\s*:/.test(line)) {
      for (const m of line.matchAll(/var\(--wb-([a-z-]+)\)/g)) {
        borderSpendKeys6.add(`${file.name}|${m[1]}`);
      }
    }
    // Utility form: border-(--wb-…) (the var() shorthand).
    for (const m of line.matchAll(/border-\(--wb-([a-z-]+)\)/g)) {
      borderSpendKeys6.add(`${file.name}|${m[1]}`);
    }
  }
  // A status hue spent through a template (the badge
  // family's `hue` local) on a border property.
  if (file.text.includes("var(--wb-status-${") && /border(Color)?\s*:/.test(file.text)) {
    borderSpendKeys6.add(`${file.name}|status-<dynamic>`);
  }
}
for (const key of borderSpendKeys6) {
  if (!(key in BORDER_SPENDS6)) censusFail6(`unclassified border spend: ${key}`);
}
for (const key of Object.keys(BORDER_SPENDS6)) {
  if (!borderSpendKeys6.has(key)) censusFail6(`stale border-spend classification: ${key}`);
}
for (const [key, [kind, reason]] of Object.entries(BORDER_SPENDS6)) {
  if (kind === "provisional" && borderSpendKeys6.has(key)) {
    console.log(`NOTE [census] provisional border spend: ${key} — ${reason}`);
  }
}
// Color-mix census — every color-mix spend in the
// components, classified below as priced by a named
// part or classified with its reason; the per-file
// occurrence count must match the classifications, and
// each classification's needle must still be present
// (a vanished spend makes its classification stale —
// itself a finding). The needles carry the mix
// percentages: this kit's constants are inline
// literals, so a changed percentage breaks its needle.
const COLOR_MIX_SPENDS6 = [
  { file: "AppShell.tsx", needle: "var(--wb-okabe-vermilion) 16%", as: "priced — Part 3 family B (hot CountBadge tint); on the active nav row the stack is M4" },
  { file: "AppShell.tsx", needle: "var(--wb-okabe-vermilion) 43%", as: "priced — Part 3 family B (hot CountBadge text mix); the active-row stack is M4" },
  { file: "Badge.tsx", needle: "${hue} 14%", as: "priced — Part 3 family A (approved tint)" },
  { file: "Button.tsx", needle: "var(--wb-accent) 88%", as: "priced — Part 5 (primary active mix)" },
  { file: "Button.tsx", needle: "var(--wb-danger) 88%", as: "priced — Part 5 (danger hover mix)" },
  { file: "Button.tsx", needle: "var(--wb-danger) 78%", as: "priced — Part 5 (danger active mix)" },
  { file: "Chip.tsx", needle: "${pressed ? 22 : 14}%", as: "priced — Part 3 family A (chip tints, rest 14% / pressed 22%)" },
  { file: "DegradedBanner.tsx", needle: "var(--wb-status-stale) 14%", as: "priced — Part 3 family A2 (banner ground)" },
  { file: "GroupedList.tsx", needle: "var(--wb-status-hard-gate) 12%", as: "priced — Part 3 family C (NoticeRow blend)" },
  { file: "GroupedList.tsx", needle: "var(--wb-okabe-orange) 20%", as: "priced — Part 3 family C (NoticeRow stale blend)" },
  { file: "Lane.tsx", needle: "var(--wb-status-stale) 14%", as: "priced — Part 3 family A (count chip on the stale tint)" },
  { file: "LogRow.tsx", needle: "${hue} 16%", as: "priced — Part 3 family B (KindBadge tint)" },
  { file: "LogRow.tsx", needle: "${hue} 43%", as: "priced — Part 3 family B (KindBadge text mix)" },
  {
    file: "LogRow.tsx",
    needle: "var(--wb-content-primary) 45%",
    as: "classified — the drawer backdrop composite carries no text and no text pair over it is well-formed: the dismiss control is aria-labelled only (no visible glyph), the panel it serves is opaque surface-2 (its text is priced in Parts 1–2), and the page behind an aria-modal drawer is deliberately obscured and inert — subordination is the composite's job, so no pair is invented for it",
  },
  {
    file: "Sheet.tsx",
    needle: "var(--wb-content-primary) 45%",
    as: "classified — the backdrop composite, as the LogRow drawer entry: no text pair over it is well-formed, and the panel it serves is opaque surface-3",
  },
  { file: "StateControls.tsx", needle: "var(--wb-status-stale) 14%", as: "priced — Part 3 family A2 (FieldError ground)" },
  { file: "StatusChip.tsx", needle: "${TONE_HUE[tone]} 14%", as: "priced — Part 3 family A (chip tint)" },
];
let mixCensusFailures6 = 0;
function mixCensusFail6(label) {
  mixCensusFailures6 += 1;
  console.log(`FAIL [census-6] ${label}`);
}
let mixSpendsClassified6 = 0;
for (const file of componentFiles6) {
  const found = (file.text.match(/color-mix\(/g) || []).length;
  const expected = COLOR_MIX_SPENDS6.filter((c) => c.file === file.name);
  if (found !== expected.length) {
    mixCensusFail6(
      `${file.name}: ${found} color-mix spend(s), ${expected.length} classification(s)`,
    );
  }
  for (const c of expected) {
    if (!file.text.includes(c.needle)) {
      mixCensusFail6(`${file.name}: stale color-mix classification (needle not found)`);
    } else {
      mixSpendsClassified6 += 1;
      if (verbose) console.log(`PASS [census-6] ${file.name}: color-mix ${c.as}`);
    }
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
