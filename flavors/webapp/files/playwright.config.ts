/**
 * Playwright config for the rendered legs (tests/e2e/): the
 * built sample app on the suite's OWN scratch state — the
 * server is the production build artifact, pointed at a
 * per-run port, and no leg touches a deployed or live
 * server.
 *
 * The app must be BUILT first (`pnpm build`, which the
 * composed check runs); the sanctioned entry is the shard
 * runner (tools/e2e-shard.mjs), which owns the port and
 * scratch allocation per shard. Run directly, this config
 * defaults to the qa shard's port.
 *
 * ONE scratch dir per suite run: Playwright loads this
 * config in the main process and again in every worker, so
 * the first loader mints the path into the environment and
 * later loaders inherit it — without the mint, each worker
 * would name different scratch state than the server's.
 */
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig } from "@playwright/test";

const scratch = process.env.E2E_SCRATCH ?? mkdtempSync(join(tmpdir(), "starter-e2e-"));
process.env.E2E_SCRATCH = scratch;
const PORT = process.env.E2E_PORT ?? "3510";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node apps/web/dist/server.js",
    url: `http://127.0.0.1:${PORT}/health`,
    env: { PORT },
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
