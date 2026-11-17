#!/usr/bin/env node
/**
 * The shard entry for the rendered legs (tests/e2e/) — the
 * one committed invocation a gate lane calls instead of
 * hand-rolling the Playwright leg in shell:
 *
 *   node tools/e2e-shard.mjs <qa|app> [options]
 *
 *   --sha <sha>       assert HEAD equals this commit and the
 *                     tracked tree is clean before running
 *                     (the same-tree assertion: a leg's
 *                     verdict names the tree it measured)
 *   --port <n>        E2E_PORT (defaults: qa 3510, app 3520
 *                     — a shard per session by default; when
 *                     shards share one machine, pass
 *                     distinct ports)
 *   --workers <n>     Playwright workers (default 1, the
 *                     config's own form; a venue lane passes
 *                     its measured count)
 *   --only <substr>   run only family files whose name
 *                     contains the substring (smoke runs)
 *
 * The shard owns: the family partition below, a per-shard
 * E2E_PORT + scratch dir, the browser-binary ensure, a
 * port-free check before the run (a busy port aborts —
 * another suite owns it) and after it (the final leg: the
 * port must be free again; Playwright stops its webServer
 * on exit, and a still-bound port is a teardown failure,
 * exit 97). Its verdict is Playwright's own exit code,
 * conjoined with the teardown leg.
 *
 * The partition is a PARTITION: every tests/e2e/*.spec.ts
 * on disk belongs to exactly one family, and this script
 * fails before running anything if a spec is unassigned,
 * double-assigned, or claimed but absent — a new spec
 * forces an explicit family decision here, never a silent
 * drop from the gate. Families: `qa` carries the rendered
 * legs (the standing practices in docs/checks.md); `app`
 * carries the project's own surface specs, and starts
 * empty — running an empty family is a clean no-op that
 * says so, because the seed ships no app specs yet.
 *
 * Prerequisites the shard does NOT own: `pnpm install` and
 * `pnpm build` in the caller's clone, run before this
 * script, and the composed check (`pnpm check`), which a
 * gate runs beside this invocation — not inside it.
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const FAMILIES = {
  qa: [
    "qa-axe.spec.ts",
    "qa-dead-click.spec.ts",
    "qa-geometry.spec.ts",
    "qa-parity.spec.ts",
    "qa-truncation.spec.ts",
  ],
  app: [],
};

const DEFAULT_PORTS = { qa: "3510", app: "3520" };

function fail(message, code) {
  console.error(`e2e-shard: ${message}`);
  process.exit(code);
}

const args = process.argv.slice(2);
const shard = args[0];
if (!Object.hasOwn(FAMILIES, shard ?? "")) {
  fail(
    "usage: e2e-shard.mjs <qa|app> [--sha <sha>] [--port <n>] [--workers <n>] [--only <substr>]",
    64,
  );
}
let sha = null;
let port = DEFAULT_PORTS[shard];
let workers = "1";
let only = null;
for (let i = 1; i < args.length; i += 2) {
  const flag = args[i];
  const value = args[i + 1];
  if (value === undefined) fail(`missing value for ${flag}`, 64);
  if (flag === "--sha") sha = value;
  else if (flag === "--port") port = value;
  else if (flag === "--workers") workers = value;
  else if (flag === "--only") only = value;
  else fail(`unknown flag ${flag}`, 64);
}

// The partition check: the families' claim over the suite
// on disk must be exact — nothing unassigned, nothing
// double-assigned, nothing named that does not exist.
const onDisk = readdirSync(join(repoRoot, "tests", "e2e"))
  .filter((name) => name.endsWith(".spec.ts"))
  .sort();
const claimed = new Map();
for (const [family, files] of Object.entries(FAMILIES)) {
  for (const file of files) {
    if (claimed.has(file)) {
      fail(
        `partition: ${file} is claimed by both ${claimed.get(file)} and ${family}`,
        65,
      );
    }
    claimed.set(file, family);
  }
}
for (const file of onDisk) {
  if (!claimed.has(file)) {
    fail(
      `partition: ${file} is in no shard family — assign it in tools/e2e-shard.mjs`,
      65,
    );
  }
}
for (const file of claimed.keys()) {
  if (!onDisk.includes(file)) {
    fail(`partition: ${file} is claimed by ${claimed.get(file)} but not on disk`, 65);
  }
}

let specs = FAMILIES[shard].map((file) => join("tests", "e2e", file));
if (only !== null) {
  specs = specs.filter((path) => path.includes(only));
  if (specs.length === 0) fail(`--only ${only} matches no file in shard ${shard}`, 64);
}
if (specs.length === 0) {
  console.log(`e2e-shard ${shard}: family carries no specs yet — nothing to run`);
  process.exit(0);
}

// The same-tree assertion, when the caller names the tree.
if (sha !== null) {
  const head = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  const dirty = spawnSync("git", ["status", "--porcelain", "--untracked-files=no"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  const actual = (head.stdout ?? "").trim();
  if (head.status !== 0 || actual !== sha) {
    fail(`tree assertion: HEAD is ${actual || "(unreadable)"}, expected ${sha}`, 66);
  }
  if ((dirty.stdout ?? "").trim() !== "") {
    fail("tree assertion: tracked tree is dirty", 66);
  }
  console.log(`e2e-shard ${shard}: tree asserted at ${sha} (tracked clean)`);
}

function portFree(candidate) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.listen(Number(candidate), "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
  });
}

if (!(await portFree(port))) {
  fail(`port ${port} is busy before the run — another suite owns it; pass --port`, 69);
}

// The browser binary, ensured the canonical way (idempotent).
const install = spawnSync("pnpm", ["exec", "playwright", "install", "chromium"], {
  cwd: repoRoot,
  stdio: "inherit",
});
if (install.status !== 0) {
  fail("playwright install chromium failed", install.status ?? 1);
}

const scratch = mkdtempSync(join(tmpdir(), `starter-e2e-shard-${shard}-`));
console.log(
  `e2e-shard ${shard}: ${specs.length} spec file(s), port ${port}, workers ${workers}, scratch ${scratch}`,
);
const child = spawn("pnpm", ["exec", "playwright", "test", ...specs, "--workers", workers], {
  cwd: repoRoot,
  stdio: "inherit",
  env: { ...process.env, E2E_PORT: port, E2E_SCRATCH: scratch },
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    child.kill(signal);
  });
}
const status = await new Promise((resolve) => {
  child.on("close", (code) => resolve(code ?? 1));
});

// The final leg: the port must be free again (teardown).
if (!(await portFree(port))) {
  console.error(`e2e-shard ${shard}: TEARDOWN_FAIL — port ${port} still bound after the run`);
  process.exit(status === 0 ? 97 : status);
}
console.log(`e2e-shard ${shard}: port ${port} free after the run`);
process.exit(status);
