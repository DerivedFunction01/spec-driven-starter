import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  BADGE_FG_HUE_PCT, BADGE_TINT_PCT, BADGE_TONES,
  SURFACES, contentHex, here, hexToRgb, lin, luminance, mixRgb,
  ratio, ratioRgb, resolveColor, resolveSemantic, rgbToHex,
  surfaceHex, tokens, verbose,
} from "./contrast-core.mjs";

// Part 5a — non-text pairs (focus + boundaries) and the
// spend census (see the header note). All bars are the
// WCAG non-text 3:1, fatal.
const NON_TEXT_BAR = 3;
export let ntChecked = 0;
export let ntFailures = 0;
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
export const scannedFiles = [
  ...scanDir("components", [".tsx"]),
  ...scanDir("themes", [".css"]),
];
export let censusFailures = 0;
function censusFail(label) {
  censusFailures += 1;
  console.log(`FAIL [census] ${label}`);
}
// Focus spends: every focus outline must spend the
// focus role.
export let focusSpends = 0;
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
export let outlineNoneCount = 0;
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
export const borderSpendKeys = new Set();
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
export let mixChecked = 0;
export let mixFailures = 0;
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
export let mixNtChecked = 0;
export let mixNtFailures = 0;
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
export let mixCensusFailures = 0;
function mixCensusFail(label) {
  mixCensusFailures += 1;
  console.log(`FAIL [census-5b] ${label}`);
}
export let mixSpendsClassified = 0;
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

