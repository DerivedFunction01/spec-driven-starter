import {
  BADGE_FG_HUE_PCT, BADGE_TINT_PCT, BADGE_TONES,
} from "./contrast-core.mjs";
import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import {
  SURFACES, here, hexToRgb, lin, luminance, mixRgb, ratio,
  ratioRgb, resolveHue, resolveSemantic, resolveText, rgbToHex,
  tokens, verbose,
} from "./contrast-core.mjs";

// Part 6 — non-text pairs, composite grounds, and the
// spend census (see the header note). Non-text families
// hold the WCAG non-text 3:1; composite text families
// hold the same fatal 4.5:1 as Parts 1–5.
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
export let mix6Checked = 0;
export let mix6Failures = 0;
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
  return readdirSync(join(kitRoot6, dir), { recursive: true })
    .filter((f) => exts.some((e) => f.endsWith(e)))
    .sort()
    .map((f) => ({ name: basename(f), text: readFileSync(join(kitRoot6, dir, f), "utf8") }));
}
export const componentFiles6 = scanDir6("components", [".tsx"]);
const indexCss6 = readFileSync(join(kitRoot6, "themes", "index.css"), "utf8");
export let censusFailures6 = 0;
function censusFail6(label) {
  censusFailures6 += 1;
  console.log(`FAIL [census] ${label}`);
}
// Focus spends: every focus outline, in the components
// and in the kit-owned theme rules, spends the
// focus-ring role and no other token.
export let focusSpends6 = 0;
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
    needle: "wb-toggle group relative inline-flex",
    by: "group ring on the track span (group-focus-visible outline utilities) + the kit theme rule .wb-toggle:focus-visible .wb-toggle-track, whose inset on-accent separator band is priced in F3",
  },
];
export let outlineNoneCount6 = 0;
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
// provisional (a re-point owed elsewhere, printed as a
// NOTE on every run until the spend moves — the one
// entry this class carried, Button's secondary
// boundary, retired when its re-point to field-border
// landed). A hue spent through
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
  "Button.tsx|field-border": ["priced", "secondary variant's boundary — B1"],
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
export const borderSpendKeys6 = new Set();
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
export let mixCensusFailures6 = 0;
function mixCensusFail6(label) {
  mixCensusFailures6 += 1;
  console.log(`FAIL [census-6] ${label}`);
}
export let mixSpendsClassified6 = 0;
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

