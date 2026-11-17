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
// Usage: bun viewer/tools/verify-contrast.mjs [--verbose]
// Exit 1 on any failure.

import { readFileSync } from "node:fs";
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

console.log(
  `verify-contrast: ${checked} status-text/surface pairs checked, ` +
    `${contentChecked} content/surface pairs checked, ` +
    `${failures + contentFailures} failure(s)`,
);
console.log(
  `verify-contrast: ${tintChecked} text-on-tint pairs checked (Part 3), ` +
    `${tintFailures} failure(s)`,
);
process.exit(failures || contentFailures || tintFailures ? 1 : 0);
