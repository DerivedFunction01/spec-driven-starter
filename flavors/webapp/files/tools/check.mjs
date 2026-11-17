// The webapp flavor's composed check: typecheck + build,
// format, the no-any rule, the surface checks (raw elements,
// value slots, dead classes — their allowlist data lives in
// check-data.mjs), the kit legs (when the project carries
// packages/ui-kit: token-regeneration byte-identity, the
// contrast gate, and the kit's own typecheck served by its
// package), and the tests. One command, aggregate-then-
// verdict: every leg runs, every failure is reported, and
// the verdict falls at the end — a red first leg no longer
// hides the state of the rest. Before any leg, a pre-flight
// parse guard runs `node --check` over this file, its data
// file, and the e2e shard entry: a module or data file that
// does not parse is a gate that silently never ran, so the
// guard is pre-flight, not a leg. Run it from the repo
// root:  node tools/check.mjs   (or: pnpm check)
// Self-test:  node tools/check.mjs --self-test  runs the
// surface checks against synthetic fixture trees and exits.
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEAD_CLASS_ALLOWLIST,
  RAW_ELEMENT_ALLOWLIST,
  VALUE_SLOT_ALLOWLIST,
} from "./check-data.mjs";

function run(label, command, args) {
  console.log(`==> ${label}`);
  const result = spawnSync(command, args, { stdio: "inherit" });
  return result.status ?? 1;
}

// ---------------------------------------------------------------------------
// Pre-flight parse guard. `node --check` over the composed
// check's own modules and data files, resolved beside this
// file (never from the caller's cwd): check.mjs itself,
// check-data.mjs (the ruled data the legs import), and
// e2e-shard.mjs (the rendered legs' entry, a sibling tool
// no import reaches). A parse failure here means a leg
// would silently never run; the guard fails before any leg.
// ---------------------------------------------------------------------------

const GUARDED_FILES = ["check.mjs", "check-data.mjs", "e2e-shard.mjs"];

function parseGuard() {
  console.log("==> parse guard (node --check over the check's own modules)");
  const here = dirname(fileURLToPath(import.meta.url));
  let failures = 0;
  for (const name of GUARDED_FILES) {
    const result = spawnSync("node", ["--check", join(here, name)], {
      encoding: "utf8",
    });
    if (result.status !== 0) {
      failures += 1;
      console.error(`    ${name}: does not parse — its legs would never run`);
      console.error(result.stderr ?? "");
    }
  }
  if (failures === 0) {
    console.log("==> parse guard clean");
  }
  return failures;
}

function* tsFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (entry !== "node_modules" && entry !== "dist") {
        yield* tsFiles(path);
      }
    } else if (entry.endsWith(".ts")) {
      yield path;
    }
  }
}

function noAny() {
  console.log("==> no-any rule");
  const banned = /(:\s*any\b)|(\bas any\b)|(<any>)/;
  let failures = 0;
  for (const root of ["apps", "packages"]) {
    for (const file of tsFiles(root)) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, index) => {
          if (banned.test(line)) {
            console.error(
              `    ${file}:${index + 1}: any is banned — name the type, or use unknown and narrow it`,
            );
            failures += 1;
          }
        });
    }
  }
  if (failures > 0) {
    return 1;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Surface checks. Rendered surfaces live under apps/;
// packages/ is the component-library home, where raw
// elements are the library's own business (the kit scope).
// ---------------------------------------------------------------------------

const SKIP_DIRS = new Set(["node_modules", "dist", ".next", ".git"]);
const SURFACE_EXTENSIONS = [".ts", ".tsx", ".jsx", ".html"];
const TEST_FILE = /\.(test|spec)\.(ts|tsx|jsx)$/;

function walkFiles(dir, extensions, out = []) {
  if (!existsSync(dir)) {
    return out;
  }
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) {
      continue;
    }
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkFiles(full, extensions, out);
    } else if (extensions.some((ext) => entry.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

function surfaceFiles(root) {
  return walkFiles(join(root, "apps"), SURFACE_EXTENSIONS).filter(
    (file) => !TEST_FILE.test(file),
  );
}

function stylesheetFiles(root) {
  return [
    ...walkFiles(join(root, "apps"), [".css"]),
    ...walkFiles(join(root, "packages"), [".css"]),
  ];
}

function lineOf(content, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (content[i] === "\n") {
      line += 1;
    }
  }
  return line;
}

// --- Raw elements -----------------------------------------------------------

const TAG_PATTERN = /<(button|input|select|textarea|output|details|summary)(?=[\s/>])/g;
const TYPE_PATTERN = /type\s*=\s*\{?\s*["']([a-z][a-z0-9-]*)["']/;

function elementKind(tag, content, index) {
  if (tag !== "input") {
    return tag;
  }
  const tagText = content.slice(index, index + 1000).split(">")[0] ?? "";
  const type = TYPE_PATTERN.exec(tagText)?.[1];
  return type ? `input[type=${type}]` : "input";
}

function occurrencesOf(content) {
  const occurrences = [];
  for (const match of content.matchAll(TAG_PATTERN)) {
    const tag = match[1] ?? "";
    occurrences.push({
      tag,
      kind: elementKind(tag, content, match.index),
      index: match.index,
      tagText: content.slice(match.index, match.index + 2000).split(">")[0] ?? "",
    });
  }
  return occurrences;
}

function collapseWhitespace(text) {
  return text.replace(/\s+/g, " ");
}

function selectorPresent(cssText, selector) {
  const haystack = collapseWhitespace(cssText);
  const needle = collapseWhitespace(selector);
  let at = haystack.indexOf(needle);
  while (at >= 0) {
    const before = at === 0 ? "" : haystack[at - 1];
    const after = haystack[at + needle.length] ?? "";
    if (!/[A-Za-z0-9_-]/.test(before) && !/[A-Za-z0-9_-]/.test(after)) {
      return true;
    }
    at = haystack.indexOf(needle, at + 1);
  }
  return false;
}

const CLAIM_CHECKS = {
  dress({ entry, stylesheetText }) {
    const messages = [];
    const cite = entry.claim.cite;
    if (!Array.isArray(cite) || cite.length === 0) {
      return ["a dress claim carries no citation — name the stylesheet and the selector"];
    }
    for (const { stylesheet, selector } of cite) {
      if (typeof stylesheet !== "string" || typeof selector !== "string" || !selector) {
        messages.push("a citation is malformed (stylesheet and selector must be non-empty strings)");
        continue;
      }
      const css = stylesheetText(stylesheet);
      if (css === null) {
        messages.push(`cited stylesheet ${stylesheet} does not exist`);
      } else if (!selectorPresent(css, selector)) {
        messages.push(`cited stylesheet ${stylesheet} carries no selector "${selector}"`);
      }
    }
    return messages;
  },
  carrier({ entry, occurrences }) {
    if (entry.element !== "input[type=hidden]") {
      return [`a carrier claim covers input[type=hidden] only, not <${entry.element}>`];
    }
    return occurrences.some((o) => o.kind === "input[type=hidden]")
      ? []
      : ["no hidden input remains in the file — the carrier claim does not check out"];
  },
  picker({ entry, occurrences }) {
    if (entry.element !== "input[type=file]") {
      return [`a picker claim covers input[type=file] only, not <${entry.element}>`];
    }
    return occurrences.some((o) => o.kind === "input[type=file]" && /\bhidden\b/.test(o.tagText))
      ? []
      : ["the file's file input is not rendered hidden — the picker claim does not check out"];
  },
  standin() {
    return [];
  },
  labelled({ entry, occurrences, content }) {
    const unlabelled = occurrences.filter((o) => !/aria-label\s*=/.test(o.tagText));
    if (unlabelled.length === 0) {
      return [];
    }
    const first = unlabelled[0];
    return [
      `${unlabelled.length} occurrence(s) of <${entry.element}> carry no aria-label (first at line ${lineOf(content, first.index)})`,
    ];
  },
};

function verifyRawAllowlist(root, allowlist) {
  const failures = [];
  const cssCache = new Map();
  const stylesheetText = (rel) => {
    if (!cssCache.has(rel)) {
      const abs = join(root, rel);
      cssCache.set(rel, existsSync(abs) ? readFileSync(abs, "utf8") : null);
    }
    return cssCache.get(rel);
  };
  for (const entry of allowlist) {
    const fail = (message) =>
      failures.push({ file: entry.file, element: entry.element, message });
    const abs = join(root, entry.file);
    if (!existsSync(abs)) {
      fail("the entry's file no longer exists — the exemption has no subject; remove it or re-argue it");
      continue;
    }
    const content = readFileSync(abs, "utf8");
    const occurrences = occurrencesOf(content).filter(
      (o) => o.kind === entry.element || o.tag === entry.element,
    );
    if (occurrences.length === 0) {
      fail(`the file no longer contains a raw <${entry.element}> — the exemption has no subject; remove it or re-argue it`);
      continue;
    }
    const claim = entry.claim;
    if (!claim || typeof claim.type !== "string") {
      fail('the entry carries no machine-checkable claim — a prose reason alone no longer exempts');
      continue;
    }
    const check = CLAIM_CHECKS[claim.type];
    if (!check) {
      fail(`unknown claim type "${claim.type}" — the claim set is closed; argue a new type in check.mjs`);
      continue;
    }
    for (const message of check({ entry, occurrences, content, stylesheetText })) {
      fail(message);
    }
  }
  return failures;
}

function rawElementFindings(root, allowlist) {
  const findings = [];
  for (const failure of verifyRawAllowlist(root, allowlist)) {
    findings.push(
      `${failure.file} <${failure.element}>: allowlist verification: ${failure.message}`,
    );
  }
  for (const file of surfaceFiles(root)) {
    const rel = relative(root, file);
    const content = readFileSync(file, "utf8");
    for (const occurrence of occurrencesOf(content)) {
      const covered = allowlist.some(
        (entry) =>
          entry.file === rel &&
          (entry.element === occurrence.kind || entry.element === occurrence.tag),
      );
      if (covered) {
        continue;
      }
      findings.push(
        `${rel}:${lineOf(content, occurrence.index)}: raw <${occurrence.kind}> renders outside the designed components — convert it to the kit component, or argue an allowlist entry in tools/check-data.mjs`,
      );
    }
  }
  return findings;
}

// --- CSS blocks (shared by value slots and dead classes) --------------------

function cssBlocks(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
  const blocks = [];
  const walk = (chunk, base) => {
    let at = 0;
    while (at < chunk.length) {
      const open = chunk.indexOf("{", at);
      if (open < 0) {
        return;
      }
      const selector = chunk.slice(at, open).trim();
      let depth = 1;
      let close = open + 1;
      while (close < chunk.length && depth > 0) {
        if (chunk[close] === "{") depth += 1;
        if (chunk[close] === "}") depth -= 1;
        close += 1;
      }
      const body = chunk.slice(open + 1, close - 1);
      if (body.includes("{")) {
        walk(body, base + open + 1);
      } else if (selector) {
        blocks.push({ selector, body, index: base + at });
      }
      at = close;
    }
  };
  walk(text, 0);
  return blocks;
}

// --- Value slots --------------------------------------------------------------

function slotViolation(body) {
  const capped = /max-width\s*:\s*[\d.]+%/.test(body);
  const nowrap = /white-space\s*:\s*nowrap/.test(body);
  const ellipsis = /text-overflow\s*:\s*ellipsis/.test(body);
  if (capped && (nowrap || ellipsis)) {
    return "value-cap-clip";
  }
  if (nowrap && ellipsis) {
    return "value-nowrap-clip";
  }
  return null;
}

function valueSlotFindings(root, allowlist) {
  const findings = [];
  const matched = new Set();
  for (const entry of allowlist) {
    if (!entry.file || !entry.selector || !entry.reason) {
      findings.push(
        "value-slots allowlist: an entry with an empty file, selector, or reason fails the check — the allowlist audits itself",
      );
    }
  }
  for (const file of stylesheetFiles(root)) {
    const rel = relative(root, file);
    const content = readFileSync(file, "utf8");
    for (const block of cssBlocks(content)) {
      const kind = slotViolation(block.body);
      if (!kind) {
        continue;
      }
      const key = `${rel}|${block.selector}`;
      const exempt = allowlist.some(
        (entry) => entry.file === rel && entry.selector === block.selector,
      );
      if (exempt) {
        matched.add(key);
        continue;
      }
      findings.push(
        `${rel}:${lineOf(content, block.index)}: [${kind}] slot "${block.selector}" clips its text — values wrap or rows stack, never clip`,
      );
    }
  }
  for (const entry of allowlist) {
    if (entry.file && entry.selector && !matched.has(`${entry.file}|${entry.selector}`)) {
      findings.push(
        `value-slots allowlist: stale entry ${entry.file} "${entry.selector}" — the slot no longer carries a clipping pattern`,
      );
    }
  }
  return findings;
}

// --- Dead classes -------------------------------------------------------------

function definedClasses(root) {
  const defined = new Set();
  for (const file of stylesheetFiles(root)) {
    const content = readFileSync(file, "utf8");
    for (const block of cssBlocks(content)) {
      for (const match of block.selector.matchAll(/\.([A-Za-z_][\w-]*)/g)) {
        defined.add(match[1]);
      }
    }
  }
  return defined;
}

function referencedClasses(root) {
  const refs = new Map();
  const attribute = /class(?:Name)?\s*=\s*\{?\s*("([^"]*)"|'([^']*)'|`([^`]*)`)/g;
  for (const file of surfaceFiles(root)) {
    const rel = relative(root, file);
    const content = readFileSync(file, "utf8");
    for (const match of content.matchAll(attribute)) {
      const raw = match[2] ?? match[3] ?? match[4] ?? "";
      const isTemplate = match[4] !== undefined;
      const parts = isTemplate ? raw.split(/\$\{[^}]*\}/) : [raw];
      parts.forEach((part, partIndex) => {
        const tokens = part.split(/\s+/).filter(Boolean);
        tokens.forEach((token, tokenIndex) => {
          const fragment =
            isTemplate &&
            ((partIndex < parts.length - 1 && tokenIndex === tokens.length - 1) ||
              (partIndex > 0 && tokenIndex === 0));
          if (!refs.has(token)) {
            refs.set(token, { file: rel, line: lineOf(content, match.index), fragment });
          }
        });
      });
    }
  }
  return refs;
}

function deadClassFindings(root, allowlist) {
  const findings = [];
  const defined = definedClasses(root);
  const refs = referencedClasses(root);
  for (const [token, ref] of refs) {
    if (defined.has(token)) {
      continue;
    }
    if (
      ref.fragment &&
      [...defined].some((name) => name.startsWith(token) || name.endsWith(token))
    ) {
      continue;
    }
    if (token in allowlist) {
      continue;
    }
    findings.push(
      `${ref.file}:${ref.line}: class "${token}" is referenced but defined in no stylesheet — style it, remove it, or name its non-CSS consumer in tools/check-data.mjs`,
    );
  }
  for (const name of Object.keys(allowlist)) {
    if (defined.has(name)) {
      findings.push(
        `dead-classes allowlist: stale entry "${name}" — the class has gained a stylesheet definition`,
      );
    } else if (!refs.has(name)) {
      findings.push(
        `dead-classes allowlist: stale entry "${name}" — the class is no longer referenced`,
      );
    }
  }
  return findings;
}

function surfaceChecks(root) {
  console.log("==> surface checks (raw elements, value slots, dead classes)");
  const findings = [
    ...rawElementFindings(root, RAW_ELEMENT_ALLOWLIST),
    ...valueSlotFindings(root, VALUE_SLOT_ALLOWLIST),
    ...deadClassFindings(root, DEAD_CLASS_ALLOWLIST),
  ];
  for (const finding of findings) {
    console.error(`    ${finding}`);
  }
  if (findings.length > 0) {
    console.error(`==> surface checks: ${findings.length} finding(s)`);
    return 1;
  }
  console.log("==> surface checks clean");
  return 0;
}

// ---------------------------------------------------------------------------
// Kit legs. A project carrying the seeded UI kit at
// packages/ui-kit is gated on the kit's own discipline,
// in served-by form: the legs read the kit's declared
// shape (its generator, its gate, its package scripts)
// rather than restating it here. Absent kit, no legs —
// the seed is the enrollment.
// ---------------------------------------------------------------------------

function kitByteIdentity(kitRoot) {
  console.log("==> kit: token regeneration byte-identity");
  const staging = mkdtempSync(join(tmpdir(), "webapp-check-kit-"));
  try {
    const staged = join(staging, "ui-kit");
    cpSync(kitRoot, staged, {
      recursive: true,
      filter: (src) => {
        const rel = relative(kitRoot, src);
        return !rel.split(/[\\/]/).some((part) => part === "node_modules" || part === "dist");
      },
    });
    const gen = spawnSync("node", [join(staged, "tools", "gen-tokens.mjs")], {
      encoding: "utf8",
    });
    if (gen.status !== 0) {
      console.error(`    the kit generator failed in a staged copy:\n${gen.stderr ?? ""}`);
      return 1;
    }
    const realThemes = join(kitRoot, "themes");
    const stagedThemes = join(staged, "themes");
    const names = readdirSync(realThemes).sort();
    const stagedNames = readdirSync(stagedThemes).sort();
    if (JSON.stringify(names) !== JSON.stringify(stagedNames)) {
      console.error(
        `    regenerated theme set differs: checked in [${names.join(", ")}], regenerated [${stagedNames.join(", ")}]`,
      );
      return 1;
    }
    for (const name of names) {
      const checkedIn = readFileSync(join(realThemes, name));
      const regenerated = readFileSync(join(stagedThemes, name));
      if (!checkedIn.equals(regenerated)) {
        console.error(
          `    themes/${name} differs from a fresh regeneration — the checked-in themes are stale; regenerate with the kit's gen-tokens and land the result`,
        );
        return 1;
      }
    }
    console.log("==> kit themes regenerate byte-identically");
    return 0;
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
}

function kitLegs(root) {
  const kitRoot = join(root, "packages", "ui-kit");
  if (!existsSync(join(kitRoot, "tools", "verify-contrast.mjs"))) {
    return [];
  }
  const legs = [];
  legs.push(["kit: token regeneration byte-identity", kitByteIdentity(kitRoot)]);
  legs.push([
    "kit: contrast gate",
    run("kit: contrast gate (verify-contrast)", "node", [
      join(kitRoot, "tools", "verify-contrast.mjs"),
    ]),
  ]);
  const pkg = JSON.parse(readFileSync(join(kitRoot, "package.json"), "utf8"));
  if (pkg.scripts && typeof pkg.scripts.typecheck === "string") {
    legs.push([
      "kit: typecheck",
      run(`kit: typecheck (served by ${pkg.name}'s own script)`, "pnpm", [
        "--filter",
        pkg.name,
        "run",
        "typecheck",
      ]),
    ]);
  }
  return legs;
}

// ---------------------------------------------------------------------------
// Self-test: synthetic fixture trees exercising every rule,
// the allowlist verification leg, and the stale-entry rules.
// ---------------------------------------------------------------------------

function selfTest() {
  const root = mkdtempSync(join(tmpdir(), "webapp-check-selftest-"));
  const failures = [];
  const expect = (cond, label) => {
    if (!cond) failures.push(label);
  };
  try {
    const write = (rel, body) => {
      const path = join(root, rel);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, body, "utf8");
    };
    write(
      "apps/web/bad.tsx",
      'export const A = () => <button type="button">Hi</button>;\n',
    );
    write(
      "apps/web/multi.tsx",
      'export const B = () => (\n  <select\n    name="x"\n  >\n    <option />\n  </select>\n);\n',
    );
    write(
      "apps/web/carrier.tsx",
      'export const C = () => <input type="hidden" name="id" />;\n',
    );
    write(
      "apps/web/page.tsx",
      'export const P = () => <div className="defined ghost tone-warm">x</div>;\n' +
        "export const Q = ({ tone }) => <div className={`tone-${tone}`}>y</div>;\n",
    );
    write(
      "apps/web/styles.css",
      ".defined { color: red; }\n" +
        ".tone-warm { color: orange; }\n" +
        ".capped { max-width: 46%; white-space: nowrap; text-overflow: ellipsis; }\n" +
        ".squeezed { white-space: nowrap; text-overflow: ellipsis; }\n" +
        ".fine { max-width: 46%; }\n",
    );

    const raw = rawElementFindings(root, [
      {
        file: "apps/web/carrier.tsx",
        element: "input[type=hidden]",
        reason: "fixture carrier",
        claim: { type: "carrier" },
      },
    ]);
    expect(raw.length === 2, `raw elements: expected 2 findings, got ${raw.length}: ${raw.join(" | ")}`);
    expect(
      raw.some((f) => f.includes("bad.tsx:1")) && raw.some((f) => f.includes("multi.tsx:2")),
      "raw elements: the button and the multi-line select are flagged at their lines",
    );
    const verified = verifyRawAllowlist(root, [
      {
        file: "apps/web/carrier.tsx",
        element: "input[type=hidden]",
        claim: { type: "carrier" },
      },
      { file: "apps/web/ghost.tsx", element: "button", claim: { type: "standin" } },
      { file: "apps/web/bad.tsx", element: "button", reason: "prose only" },
      {
        file: "apps/web/bad.tsx",
        element: "button",
        claim: {
          type: "dress",
          cite: [{ stylesheet: "apps/web/styles.css", selector: ".missing" }],
        },
      },
    ]);
    expect(verified.length === 3, `allowlist verification: expected 3 failures, got ${verified.length}`);
    expect(
      verified.some((f) => f.file === "apps/web/ghost.tsx") &&
        verified.some((f) => f.message.includes("no machine-checkable claim")) &&
        verified.some((f) => f.message.includes('carries no selector ".missing"')),
      "allowlist verification: dead file, prose-only entry, and bad citation each fail",
    );

    const slots = valueSlotFindings(root, []);
    expect(slots.length === 2, `value slots: expected 2 findings, got ${slots.length}: ${slots.join(" | ")}`);
    expect(
      slots.some((f) => f.includes("value-cap-clip")) &&
        slots.some((f) => f.includes("value-nowrap-clip")),
      "value slots: both rules fire; the uncapped .fine slot stays clean",
    );
    const staleSlot = valueSlotFindings(root, [
      { file: "apps/web/styles.css", selector: ".fine", reason: "fixture" },
    ]);
    expect(
      staleSlot.some((f) => f.includes("stale entry")),
      "value slots: an entry whose slot carries no pattern is stale",
    );

    const dead = deadClassFindings(root, {});
    expect(dead.length === 1, `dead classes: expected 1 finding, got ${dead.length}: ${dead.join(" | ")}`);
    expect(dead[0]?.includes('"ghost"'), "dead classes: the undefined class is flagged");
    const deadAllowed = deadClassFindings(root, { ghost: "fixture consumer" });
    expect(deadAllowed.length === 0, "dead classes: a named consumer exempts the class");
    const deadStale = deadClassFindings(root, { defined: "fixture consumer" });
    expect(
      deadStale.some((f) => f.includes("stale entry")),
      "dead classes: an entry for a now-defined class is stale",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(`check self-test FAIL: ${failure}`);
    }
    process.exit(1);
  }
  console.log(
    "check self-test: pass (raw elements flagged incl. multi-line tags, carrier verified, dead/prose-only/bad-citation allowlist entries fail, both value-slot rules fire, dead class flagged and exempted by a named consumer, stale entries flagged)",
  );
}

if (process.argv.includes("--self-test")) {
  if (parseGuard() > 0) {
    process.exit(1);
  }
  selfTest();
} else {
  if (parseGuard() > 0) {
    console.error("==> webapp check FAILED at the parse guard — no leg ran");
    process.exit(1);
  }
  const root = process.cwd();
  const legs = [];
  legs.push([
    "typecheck + build (tsc -b)",
    run("typecheck + build (tsc -b)", "pnpm", ["exec", "tsc", "-b"]),
  ]);
  legs.push([
    "format check (prettier)",
    run("format check (prettier)", "pnpm", [
      "exec",
      "prettier",
      "--check",
      "apps",
      "packages",
      "tools",
      "package.json",
      "tsconfig.json",
      "tsconfig.base.json",
    ]),
  ]);
  legs.push(["no-any rule", noAny()]);
  legs.push(["surface checks", surfaceChecks(root)]);
  legs.push(...kitLegs(root));
  legs.push([
    "unit + smoke tests (node --test)",
    run("unit + smoke tests (node --test)", "node", [
      "--test",
      "apps/web/dist/server.test.js",
    ]),
  ]);
  const failed = legs.filter(([, code]) => code !== 0);
  if (failed.length > 0) {
    console.error(
      `==> webapp check FAILED: ${failed.map(([label]) => label).join("; ")}`,
    );
    process.exit(1);
  }
  console.log(`==> webapp check passed (all ${legs.length} legs)`);
}
