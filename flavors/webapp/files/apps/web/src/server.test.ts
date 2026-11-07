import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";

import { createAppServer } from "./server.js";

// The test wiring: node:test for units, and the same runner
// drives the HTTP smoke tests below against the real server —
// the seed of the e2e suite. No test-only server exists.
let base = "";
let server: ReturnType<typeof createAppServer>;

before(async () => {
  server = createAppServer();
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address() as AddressInfo;
  base = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

test("health returns the shared contract shape", async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  const body = (await res.json()) as { status: string; contract: string };
  assert.equal(body.status, "ok");
  assert.equal(body.contract, "api/1");
});

test("unknown routes answer problem details", async () => {
  const res = await fetch(`${base}/nope`);
  assert.equal(res.status, 404);
  const body = (await res.json()) as { type: string; status: number };
  assert.equal(body.status, 404);
  assert.equal(typeof body.type, "string");
});
