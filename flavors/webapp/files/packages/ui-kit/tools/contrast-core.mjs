import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const here = dirname(fileURLToPath(import.meta.url));
export const tokens = JSON.parse(readFileSync(join(here, "..", "tokens", "tokens.json"), "utf8"));
export const verbose = process.argv.includes("--verbose");
export const SURFACES = ["canvas", "1", "2", "3", "sunken"];

export function lin(channel) {
  const c = channel / 255;
  return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92;
}

export function luminance(hex) {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function ratio(fg, bg) {
  let [l1, l2] = [luminance(fg), luminance(bg)];
  if (l1 < l2) [l1, l2] = [l2, l1];
  return (l1 + 0.05) / (l2 + 0.05);
}

// Resolve a token $value to a hex: a literal, a DTCG
// alias ({primitive...} / {semantic...}) followed
// through the token tree, or a var(--ui-status-<other>)
// / var(--ui-status-<other>-text) reference to another
// status's hue or same-mode text.
export function resolveColor(raw, mode, seen = new Set()) {
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
export function resolveSemantic(raw, palette, mode) {
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

export const surfaceHex = (palette, mode, surface) =>
  resolveSemantic(tokens.semantic[palette][mode].surface[surface].$value, palette, mode);
export const contentHex = (palette, mode, voice) =>
  resolveSemantic(tokens.semantic[palette][mode].content[voice].$value, palette, mode);


export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
export function rgbToHex(rgb) {
  return `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}
export function mixRgb(a, pct, b) {
  return a.map((v, i) => (pct * v + (100 - pct) * b[i]) / 100);
}
export function ratioRgb(fg, bg) {
  // Same luminance math as ratio(), on raw float channels
  // so blends keep full precision until the verdict.
  const lumRaw = (rgb) =>
    0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
  let [l1, l2] = [lumRaw(fg), lumRaw(bg)];
  if (l1 < l2) [l1, l2] = [l2, l1];
  return (l1 + 0.05) / (l2 + 0.05);
}


export const BADGE_TINT_PCT = 16;
export const BADGE_FG_HUE_PCT = 30;
export const BADGE_TONES = ["ok", "info", "warn", "fail"];
