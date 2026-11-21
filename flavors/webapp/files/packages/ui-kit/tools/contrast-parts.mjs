import {
  BADGE_FG_HUE_PCT, BADGE_TINT_PCT, BADGE_TONES,
  SURFACES, contentHex, here, hexToRgb, lin, luminance, mixRgb,
  ratio, ratioRgb, resolveColor, resolveSemantic, rgbToHex,
  surfaceHex, tokens, verbose,
} from "./contrast-core.mjs";

// Part 1 — status text x surfaces.
export let failures = 0;
export let checked = 0;
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
export let contentChecked = 0;
export let contentFailures = 0;
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
export let tintChecked = 0;
export let tintFailures = 0;
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
export let solidChecked = 0;
export let solidFailures = 0;
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

