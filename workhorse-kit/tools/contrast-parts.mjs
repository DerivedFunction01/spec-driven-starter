import {
  BADGE_FG_HUE_PCT, BADGE_TINT_PCT, BADGE_TONES,
  SURFACES, here, hexToRgb, lin, luminance, mixRgb, ratio,
  ratioRgb, resolveHue, resolveSemantic, resolveText, rgbToHex,
  tokens, verbose,
} from "./contrast-core.mjs";

export let failures = 0;
export let checked = 0;
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
export let contentChecked = 0;
export let contentFailures = 0;
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
export let buttonChecked = 0;
export let buttonFailures = 0;
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

