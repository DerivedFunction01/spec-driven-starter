#!/usr/bin/env bun
// gen-tokens.mjs — tokens/tokens.json (DTCG) -> themes/*.css
//
// Build-time only (bun). Generated files are checked in; regeneration is
// deterministic (same tokens.json -> byte-identical CSS, no timestamps).
// Usage: bun tools/gen-tokens.mjs
//
// Layout emitted (frozen, architecture.md):
//   themes/index.css   Tailwind import FIRST, then fonts + one @import per
//                      palette; :root primitives, @theme type scale, and the
//                      global rules (scrollbar, .num/.mono utilities).
//   themes/fonts.css   local @font-face only (bundled woff2, no URL fetch).
//   themes/<palette>.css  one per palette, scoped to [data-palette="<name>"]
//                      (olive also matches :root with no data-palette);
//                      modes via [data-mode="dark"] and, for Auto, the
//                      prefers-color-scheme media query.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const kitRoot = join(here, "..");
const tokensPath = join(kitRoot, "tokens", "tokens.json");
const outDir = join(kitRoot, "themes");

const tokens = JSON.parse(readFileSync(tokensPath, "utf8"));

const HEADER =
  "/* GENERATED from tokens/tokens.json by viewer/tools/gen-tokens.mjs — do not edit by hand. */\n";

// ---- name mapping: token path -> CSS variable name -------------------------
function varName(path) {
  let parts = path.slice();
  const tier = parts[0];
  if (tier === "primitive") {
    parts = parts.slice(1);
    if (parts[0] === "color") parts = parts.slice(1); // --ui-olive-500, --ui-okabe-blue
    return `--ui-${parts.join("-")}`;
  }
  if (tier === "semantic") {
    parts = parts.slice(3); // drop semantic.<palette>.<mode>
    return `--ui-${parts.join("-")}`;
  }
  if (tier === "status") {
    const [, name, kind] = parts;
    if (name === "chart") return `--ui-chart-${kind}`;
    if (kind === "hue") return `--ui-status-${name}`;
    if (kind === "text") return `--ui-status-${name}-text`;
    return `--ui-status-${name}-${kind}`;
  }
  if (tier === "component") {
    return `--ui-${parts.slice(1).join("-")}`;
  }
  if (tier === "density") {
    // density.<set>.<name> -> the SAME variable the component tier defines
    // (--ui-card-padding, --ui-row-height, ...): density re-points names,
    // it never renames them.
    return `--ui-${parts.slice(2).join("-")}`;
  }
  throw new Error(`unknown tier: ${path.join(".")}`);
}

function _lookup(pathStr) {
  let node = tokens;
  for (const p of pathStr.split(".")) {
    if (node == null || typeof node !== "object" || !(p in node))
      throw new Error(`alias target not found: ${pathStr}`);
    node = node[p];
  }
  return node;
}

// Resolve a $value to CSS text. DTCG aliases ({a.b.c}) to primitive /
// semantic / status tokens become var() references to that token's own
// variable (one-way tier references); anything else is a literal.
function cssValue(raw) {
  if (typeof raw !== "string") return String(raw);
  if (raw.startsWith("{") && raw.endsWith("}")) {
    const target = raw.slice(1, -1);
    return `var(${varName(target.split("."))})`;
  }
  return raw; // literal, or an explicit var(--ui-...) recorded in tokens.json
}

function declarations(entries, indent = "  ") {
  return entries.map(([name, value]) => `${indent + name}: ${value};`).join("\n");
}

// Flatten a token subtree into [varName, cssValue] pairs, in file order.
function flatten(node, path, out = []) {
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    if (child && typeof child === "object" && "$value" in child) {
      out.push([varName([...path, key]), cssValue(child.$value)]);
    } else if (child && typeof child === "object") {
      flatten(child, [...path, key], out);
    }
  }
  return out;
}

// ---- primitives (:root, in index.css) --------------------------------------
const primitiveDecls = [];
for (const group of ["color", "space", "radius", "font", "font-size", "line-height", "motion"]) {
  primitiveDecls.push(...flatten(tokens.primitive[group], ["primitive", group]));
}
const chartDecls = flatten(tokens.status.chart, ["status", "chart"]);

// ---- @theme type scale (house scale: fundamentals SS3) ----------------------
const ts = tokens.primitive["font-size"];
const lh = tokens.primitive["line-height"];
const themeLines = [];
for (const key of Object.keys(ts)) {
  const tw = { xs: "xs", sm: "sm", base: "base", lg: "lg", xl: "xl", "2xl": "2xl" }[key];
  themeLines.push(`  --text-${tw}: ${ts[key].$value};`);
  themeLines.push(`  --text-${tw}--line-height: ${lh[key].$value};`);
}
themeLines.push(`  --font-sans: ${tokens.primitive.font.ui.$value};`);
themeLines.push(`  --font-mono: ${tokens.primitive.font.mono.$value};`);

// ---- fonts.css ---------------------------------------------------------------
const LATIN_RANGE =
  "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, " +
  "U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, " +
  "U+2212, U+2215, U+FEFF, U+FFFD";
function fontFace(family, src, weight) {
  return [
    "@font-face {",
    `  font-family: "${family}";`,
    `  src: url("../assets/fonts/${src}") format("woff2");`,
    `  font-weight: ${weight};`,
    "  font-style: normal;",
    "  font-display: swap;",
    `  unicode-range: ${LATIN_RANGE};`,
    "}",
  ].join("\n");
}
const fontsCss =
  HEADER +
  "/* Bundled woff2 only (SIL OFL 1.1) — no external fetch, ever. */\n" +
  fontFace("Inter", "inter-var.woff2", "100 900") +
  "\n" +
  fontFace("IBM Plex Mono", "plex-mono-400.woff2", "400") +
  "\n" +
  fontFace("IBM Plex Mono", "plex-mono-500.woff2", "500") +
  "\n" +
  fontFace("IBM Plex Mono", "plex-mono-600.woff2", "600") +
  "\n";

// ---- one file per palette ------------------------------------------------------
const palettes = Object.keys(tokens.semantic);
function paletteCss(palette) {
  const isDefault = palette === "olive";
  const sel = (extra = "") =>
    isDefault
      ? `[data-palette="${palette}"]${extra}, :root:not([data-palette])${extra}`
      : `[data-palette="${palette}"]${extra}`;
  const selAuto = (extra = "") =>
    isDefault
      ? '[data-palette="' +
        palette +
        '"]:not([data-mode="light"])' +
        extra +
        ', :root:not([data-palette]):not([data-mode="light"])' +
        extra
      : `[data-palette="${palette}"]:not([data-mode="light"])${extra}`;

  function modeDecls(mode) {
    const sem = flatten(tokens.semantic[palette][mode], ["semantic", palette, mode]);
    const stat = [];
    for (const [name, st] of Object.entries(tokens.status)) {
      if (name === "chart") continue;
      stat.push([`--ui-status-${name}`, cssValue(st.hue.$value)]);
      stat.push([`--ui-status-${name}-text`, cssValue(st.text[mode].$value)]);
    }
    const comp = flatten(tokens.component, ["component"]);
    return [...sem, ...stat, ...comp];
  }

  const light = modeDecls("light");
  const dark = modeDecls("dark");
  return (
    HEADER +
    "/* Palette: " +
    palette +
    (isDefault ? " (default)" : "") +
    " — semantic + status + component tokens, both modes. */\n" +
    sel() +
    " {\n  color-scheme: light;\n" +
    declarations(light) +
    "\n}\n" +
    sel('[data-mode="dark"]') +
    " {\n  color-scheme: dark;\n" +
    declarations(dark) +
    "\n}\n" +
    "@media (prefers-color-scheme: dark) {\n  " +
    selAuto() +
    " {\n    color-scheme: dark;\n" +
    declarations(dark, "    ") +
    "\n  }\n}\n"
  );
}

// ---- density (first-class dimension; same names, two value sets) -------------
// Comfortable = fundamentals SS2.5 defaults. Compact steps each value down
// one step of the spacing scale where a smaller step exists (24->16, 16->12;
// row height 40px->32px per SS2.5). Interactive targets are never density
// tokens. Emitted last in index.css so [data-density="compact"] re-points
// the palette-scoped component tokens of the same name.
const densityComfortable = flatten(tokens.density.comfortable, ["density", "comfortable"]);
const densityCompact = flatten(tokens.density.compact, ["density", "compact"]);
const densityCss =
  '\n:root, [data-density="comfortable"] {\n' +
  declarations(densityComfortable) +
  "\n}\n" +
  '\n[data-density="compact"] {\n' +
  declarations(densityCompact) +
  "\n}\n";

// ---- index.css ------------------------------------------------------------------
const indexCss =
  HEADER +
  '@import "tailwindcss";\n' +
  '@import "./fonts.css";\n' +
  // No katex import: the kit ships no math component, no
  // KaTeX fonts, and no katex.css (gap K2, closed).
  // The file the import named was a workbench-viewer asset
  // vendored by hand beside ITS themes; here it left every
  // consumer stubbing or skipping index.css. An app that
  // renders KaTeX math vendors katex.css in its own layer.
  palettes.map((p) => `@import "./${p}.css";`).join("\n") +
  "\n\n:root {\n" +
  declarations([...primitiveDecls, ...chartDecls]) +
  "\n  scrollbar-color: var(--ui-border-default) transparent;\n  scrollbar-width: thin;\n}\n" +
  "\n@theme {\n" +
  themeLines.join("\n") +
  "\n}\n" +
  // Scroll chain: both presentations are document-flow
  // shells, so a boundary pull on the document must never
  // chain to the host — in the artifact webview that chain
  // is what triggers pull-to-refresh. overscroll-behavior
  // is not inherited, so the document-level elements
  // refuse it here: html, body, and the SDK shell wrapper.
  // (The desktop shell root and its <main> also carry it
  // inline in App.tsx; the phone shell is plain flow and
  // needs nothing of its own.)
  "\nhtml {\n  overscroll-behavior: none;\n}\n" +
  "\nbody {\n  font-family: var(--ui-font-ui);\n  background: var(--ui-surface-canvas);\n  color: var(--ui-content-primary);\n  overscroll-behavior: none;\n}\n" +
  "\n.hatch-space-root {\n  overscroll-behavior: none;\n}\n" +
  '\n.num {\n  font-feature-settings: "tnum";\n}\n' +
  '\n.mono {\n  font-family: var(--ui-font-mono);\n  font-feature-settings: "zero";\n}\n' +
  // Task lists (plan syntax standard): marked already emits
  // disabled checkbox inputs for - [ ] / - [x] items; the
  // prose scope only drops the redundant bullet and styles
  // the box from tokens.
  '\n.ui-prose li:has(> input[type="checkbox"]) {\n  list-style: none;\n}\n' +
  '\n.ui-prose li > input[type="checkbox"] {\n  accent-color: var(--ui-accent);\n  margin-right: var(--ui-space-8);\n  vertical-align: -0.12em;\n}\n' +
  // Prose links (plan syntax standard): marked emits
  // bare anchors into the prose scope, and the document
  // preflight leaves them inheriting the body colour
  // with no underline — a link inside a block of prose
  // is then distinguishable from its surrounding text
  // by nothing at all (the reader-chrome form of the
  // same shape was measured by axe as
  // link-in-text-block, serious; critic F13).
  // The prose scope gives its anchors the
  // app's link colour plus the non-colour cue: an
  // underline with a small offset. The accent token is
  // already per-palette and per-mode, so one rule
  // covers every appearance.
  '\n.ui-prose a {\n  color: var(--ui-accent);\n  text-decoration: underline;\n  text-underline-offset: 0.14em;\n}\n' +
  // Segmented controls (SegmentedControl, StateControls
  // option rows): the native radio is visually hidden, so
  // its keyboard focus indication must land on the visible
  // segment. The components also carry peer-focus-visible
  // utilities, but a utility only exists if the consumer's
  // Tailwind build generated it from kit sources (the
  // @source seam in the kit README) — this kit-owned rule
  // ships in the kit's own CSS and holds regardless.
  '\n.ui-segmented-input:focus-visible + .ui-segmented-segment {\n  outline: 2px solid var(--ui-focus-ring);\n  outline-offset: 1px;\n}\n' +
  // Toggle (components/controls/Toggle.tsx): the visible focus
  // indicator lands on the track span, not the button —
  // the button suppresses its own outline so the ring
  // hugs the switch. The track also carries
  // group-focus-visible utilities, but as with the
  // segmented rule above, a utility only exists if the
  // consumer's Tailwind build generated it; this
  // kit-owned rule ships the guarantee in the kit's own
  // CSS. It adds one thing the utility form cannot
  // express: the inset separator ring. The focus-ring
  // token IS the accent, and a checked track's fill is
  // the accent too, so the accent ring alone camouflages
  // against the checked fill — the critic
  // confirmation pass read the digest switches as
  // painting no indicator. The separator must contrast
  // with the FILL, and the one token guaranteed to do
  // that is the fill's own on- colour, so the ring is
  // inset: 2px of on-accent inside the track's edge,
  // legible in both modes and both switch states. (An
  // outset separator would need contrast with the
  // backdrop instead, which the kit cannot know — the
  // track sits on cards, rows, and canvas alike.)
  '\n.ui-toggle:focus-visible .ui-toggle-track {\n  outline: 2px solid var(--ui-focus-ring);\n  outline-offset: 1px;\n  box-shadow: inset 0 0 0 2px var(--ui-on-accent);\n}\n' +
  // Checkbox (components/controls/Checkbox.tsx): the same
  // camouflage shape as the Toggle, one component over.
  // The visible element IS the button — a locked circle
  // whose checked fill is the status-done hue — and its
  // focus outline is the focus-ring token, i.e. the
  // accent, which measures only 1.49–2.40:1 against the
  // checked fill across palettes x modes (teal light:
  // #0f766e on #009e73, 1.60:1), so the ring reads as
  // part of the disc. The component also carries
  // focus-visible utilities, but as with the rules
  // above, a utility only exists if the consumer's
  // Tailwind build generated it; this kit-owned rule
  // ships the guarantee in the kit's own CSS. The inset
  // separator is the fill's own on- colour — the white
  // the component paints its check in (Checkbox.tsx's
  // color: "#fff", mirrored here as data): the fill is
  // a constant primitive in every palette and mode, so
  // its on- colour is constant too, and the band holds
  // against the fill the same 3.42:1 the check itself
  // does, in both modes.
  '\n.ui-checkbox:focus-visible {\n  outline: 2px solid var(--ui-focus-ring);\n  outline-offset: 1px;\n  box-shadow: inset 0 0 0 2px #fff;\n}\n' +
  "\n@media (prefers-reduced-motion: reduce) {\n  *, *::before, *::after {\n    animation-duration: 0.01ms !important;\n    transition-duration: 0.01ms !important;\n  }\n}\n" +
  densityCss;

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "index.css"), indexCss);
writeFileSync(join(outDir, "fonts.css"), fontsCss);
for (const p of palettes) writeFileSync(join(outDir, `${p}.css`), paletteCss(p));
console.log(
  `gen-tokens: wrote index.css, fonts.css, ${palettes.map((p) => `${p}.css`).join(", ")}`,
);
