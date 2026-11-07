// The webapp flavor's composed check: typecheck + build,
// format, the no-any rule, and the tests. One command, fail-fast
// — the web-stack equivalent of the core gate's legs. Run it
// from the repo root:  node tools/check.mjs   (or: pnpm check)
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function run(label, command, args) {
  console.log(`==> ${label}`);
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
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
    process.exit(1);
  }
}

run("typecheck + build (tsc -b)", "pnpm", ["exec", "tsc", "-b"]);
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
]);
noAny();
run("unit + smoke tests (node --test)", "node", [
  "--test",
  "apps/web/dist/server.test.js",
]);
console.log("==> webapp check passed");
