#!/usr/bin/env node
// gen-tokens.mjs — tokens/tokens.json (DTCG) -> themes/*.css
//
// Build-time only (node, no dependencies). Generated files are checked in;
// regeneration is deterministic (same tokens.json -> byte-identical CSS,
// no timestamps), and byte-identical regeneration is the drift proof.
// Usage: node ui-kit/tools/gen-tokens.mjs
//
// Layout emitted:
//   themes/index.css      :root primitives, the global rules, and the
//                         density blocks (emitted last so a density
//                         re-points the component names).
//   themes/<palette>.css  one per palette, scoped to [data-palette="<name>"]
//                         (the first palette also matches :root with no
//                         data-palette); modes via [data-mode="dark"] and,
//                         for Auto, the prefers-color-scheme media query.
//
// The CSS prefix (--ui-) lives in exactly one place: varName() below.
// There is no fonts.css in the seed: the font tokens reference system
// stacks, and bundling font files is a Step 4 concern (see README.md).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const kitRoot = join(here, "..");
const tokensPath = join(kitRoot, "tokens", "tokens.json");
const outDir = join(kitRoot, "themes");

const tokens = JSON.parse(readFileSync(tokensPath, "utf8"));

const HEADER =
  "/* GENERATED from tokens/tokens.json by tools/gen-tokens.mjs — do not edit by hand. */\n";

// ---- name mapping: token path -> CSS variable name (the one prefix home) ---
function varName(path) {
  const parts = path.slice();
  const tier = parts[0];
  if (tier === "primitive") {
    const rest = parts.slice(1);
    if (rest[0] === "color") rest.shift(); // --ui-slate-500, --ui-white
    return `--ui-${rest.join("-")}`;
  }
  if (tier === "semantic") {
    return `--ui-${parts.slice(3).join("-")}`; // drop semantic.<palette>.<mode>
  }
  if (tier === "status") {
    const [, name, kind] = parts;
    if (kind === "hue") return `--ui-status-${name}`;
    if (kind === "text") return `--ui-status-${name}-text`;
    return `--ui-status-${name}-${kind}`;
  }
  if (tier === "component") {
    return `--ui-${parts.slice(1).join("-")}`;
  }
  if (tier === "density") {
    // density.<set>.<...> -> the SAME variable the component tier defines:
    // density re-points names, it never renames them.
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

// Resolve a $value to CSS text. DTCG aliases ({a.b.c}) become var()
// references to the target token's own variable (one-way tier references);
// anything else is a literal.
function cssValue(raw) {
  if (typeof raw !== "string") return String(raw);
  if (raw.startsWith("{") && raw.endsWith("}")) {
    return `var(${varName(raw.slice(1, -1).split("."))})`;
  }
  return raw;
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

// ---- one file per palette ----------------------------------------------------
const palettes = Object.keys(tokens.semantic);
function paletteCss(palette) {
  const isDefault = palette === palettes[0];
  const sel = (extra = "") =>
    isDefault
      ? `[data-palette="${palette}"]${extra}, :root:not([data-palette])${extra}`
      : `[data-palette="${palette}"]${extra}`;
  const selAuto = (extra = "") =>
    isDefault
      ? `[data-palette="${palette}"]:not([data-mode="light"])${extra}, :root:not([data-palette]):not([data-mode="light"])${extra}`
      : `[data-palette="${palette}"]:not([data-mode="light"])${extra}`;

  function modeDecls(mode) {
    const sem = flatten(tokens.semantic[palette][mode], ["semantic", palette, mode]);
    const stat = [];
    for (const [name, st] of Object.entries(tokens.status)) {
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
    `/* Palette: ${palette}${isDefault ? " (default)" : ""} — semantic + status + component tokens, both modes. */\n` +
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

// ---- density (same names, two value sets; emitted last in index.css) --------
const densityComfortable = flatten(tokens.density.comfortable, ["density", "comfortable"]);
const densityCompact = flatten(tokens.density.compact, ["density", "compact"]);
const densityCss =
  '\n:root, [data-density="comfortable"] {\n' +
  declarations(densityComfortable) +
  "\n}\n" +
  '\n[data-density="compact"] {\n' +
  declarations(densityCompact) +
  "\n}\n";

// ---- kit-owned focus rules -----------------------------------------------------
// The components also carry focus-visible utilities, but a
// utility only exists if the consumer's utility build
// generated it from kit sources — these rules ship in the
// kit's own CSS and hold regardless (the source kit's
// lesson). Two of them add the one thing the utility form
// cannot express: an inset separator band. The focus role
// sits on the accent scale, and a solid fill it must read
// against can BE the accent (a checked Toggle track, a
// primary Button) or a same-family hue (a checked
// Checkbox's ok disc), so the ring alone camouflages
// against the fill. The separator is the fill's own on-
// colour, inset inside the element's edge: it must
// contrast with the FILL, and the on- token is the one
// colour guaranteed to (the contrast gate prices those
// separator pairs in Part 5a). An outset separator would
// need contrast with the backdrop instead, which the kit
// cannot know — the element sits on cards, rows, and
// canvas alike.
const focusRulesCss =
  // SegmentedControl: the native radio is visually hidden,
  // so its keyboard focus indication lands on the visible
  // segment (the sibling the hook classes name).
  "\n.ui-segmented-input:focus-visible + .ui-segmented-segment {\n  outline: 2px solid var(--ui-focus);\n  outline-offset: 1px;\n}\n" +
  // Toggle: the visible indicator lands on the track, not
  // the button (the button suppresses its own outline so
  // the ring hugs the switch); the track's checked fill is
  // the accent, so the separator is on-accent.
  "\n.ui-toggle:focus-visible .ui-toggle-track {\n  outline: 2px solid var(--ui-focus);\n  outline-offset: 1px;\n  box-shadow: inset 0 0 0 2px var(--ui-on-accent);\n}\n" +
  // Checkbox: the visible element IS the button — a locked
  // circle whose checked fill is the ok hue — and the
  // separator is the white the component paints its check
  // in (Checkbox.tsx's color: var(--ui-white), mirrored
  // here as data).
  "\n.ui-checkbox:focus-visible {\n  outline: 2px solid var(--ui-focus);\n  outline-offset: 1px;\n  box-shadow: inset 0 0 0 2px var(--ui-white);\n}\n" +
  // Button, solid variants only: the fill is the accent
  // (primary) or danger, so the separator is on-accent —
  // the foreground both fills are priced with. The surface
  // variants (secondary, ghost) carry no separator: their
  // fills are surfaces the focus role already holds
  // against.
  '\n.ui-button[data-variant="primary"]:focus-visible, .ui-button[data-variant="danger"]:focus-visible {\n  box-shadow: inset 0 0 0 2px var(--ui-on-accent);\n}\n';

// ---- index.css ----------------------------------------------------------------
const indexCss =
  HEADER +
  palettes.map((p) => `@import "./${p}.css";`).join("\n") +
  "\n\n:root {\n" +
  declarations(primitiveDecls) +
  "\n  scrollbar-color: var(--ui-border-default) transparent;\n  scrollbar-width: thin;\n}\n" +
  "\nbody {\n  font-family: var(--ui-font-ui);\n  background: var(--ui-surface-canvas);\n  color: var(--ui-content-primary);\n}\n" +
  focusRulesCss +
  "\n@media (prefers-reduced-motion: reduce) {\n  *, *::before, *::after {\n    animation-duration: 0.01ms !important;\n    transition-duration: 0.01ms !important;\n  }\n}\n" +
  densityCss;

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "index.css"), indexCss);
for (const p of palettes) writeFileSync(join(outDir, `${p}.css`), paletteCss(p));
console.log(`gen-tokens: wrote index.css, ${palettes.map((p) => `${p}.css`).join(", ")}`);
