import { readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
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

// Resolve a status text $value to a hex: literal, a DTCG
// alias into primitive/status, or a var(--ui-status-*-text)
// reference to another status's same-mode text.
export function resolveText(raw, mode, seen = new Set()) {
  if (raw.startsWith("#")) return raw;
  const alias = raw.match(/^var\(--ui-status-([a-z-]+)-text\)$/);
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
// Resolve a status hue $value to a hex: literal, a DTCG
// alias into the primitives, a var(--ui-status-<other>)
// reference to another status's hue, or deferred's
// var(--ui-content-secondary) (the palette/mode's own
// secondary content token).
export function resolveHue(raw, palette, mode, seen = new Set()) {
  if (raw.startsWith("#")) return raw;
  if (raw === "var(--ui-content-secondary)") {
    return tokens.semantic[palette][mode].content.secondary.$value;
  }
  const alias = raw.match(/^var\(--ui-status-([a-z-]+)\)$/);
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


export function resolveSemantic(raw) {
  let v = raw;
  while (typeof v === "string" && v.startsWith("{")) {
    let node = tokens;
    for (const part of v.slice(1, -1).split(".")) node = node[part];
    v = node.$value;
  }
  return v;
}

export const BADGE_TINT_PCT = 16;
export const BADGE_FG_HUE_PCT = 43;
export const BADGE_TONES = {
  ok: "{primitive.color.okabe.bluish-green}",
  info: "{primitive.color.okabe.blue}",
  warn: "{primitive.color.okabe.orange}",
  fail: "{primitive.color.okabe.vermilion}",
};
