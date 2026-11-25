// verify-log-payload — deterministic pins for
// lib/log-payload, the LogRow clamp predicate. Fixture
// strings only: no DOM, no clock, no live data. Run with
// bun (the kit's TS lib imports directly):
//
//   bun tools/verify-log-payload.mjs
//
// Exit 0 iff every pin holds. The pins fix the contract
// LogRow renders by: the clamp is a strict prefix of the
// payload, cut at the line budget first and the char
// budget second; a payload equal to its clamp does not
// overflow.

import {
  LOG_PAYLOAD_MAX_CHARS,
  LOG_PAYLOAD_MAX_LINES,
  clampLogPayload,
  logPayloadOverflows,
} from "../lib/log-payload.ts";

let failures = 0;
function pin(name, cond, detail) {
  if (cond) {
    console.log(`ok ${name}`);
  } else {
    failures += 1;
    console.log(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}
const eq = (name, got, want) =>
  pin(name, got === want, `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

// The budgets are the named constants of the contract.
eq("budget-lines", LOG_PAYLOAD_MAX_LINES, 3);
eq("budget-chars", LOG_PAYLOAD_MAX_CHARS, 300);

// Short payloads never overflow and clamp to themselves.
eq("empty-clamp", clampLogPayload(""), "");
pin("empty-no-overflow", !logPayloadOverflows(""));
eq("short-clamp", clampLogPayload("ping report 3680a3e671d0"), "ping report 3680a3e671d0");
pin("short-no-overflow", !logPayloadOverflows("ping report 3680a3e671d0"));

// The char budget: exactly at it is inside; one past it
// overflows and clamps to the budget-length prefix.
const atChars = "x".repeat(LOG_PAYLOAD_MAX_CHARS);
const pastChars = "x".repeat(LOG_PAYLOAD_MAX_CHARS + 1);
pin("at-chars-no-overflow", !logPayloadOverflows(atChars));
pin("past-chars-overflow", logPayloadOverflows(pastChars));
eq("past-chars-clamp", clampLogPayload(pastChars), atChars);

// The line budget: exactly at it is inside (a trailing
// newline is the last line's own, not a new line); one
// line past it overflows and clamps to the first lines.
const atLines = "one\ntwo\nthree";
pin("at-lines-no-overflow", !logPayloadOverflows(atLines));
pin("trailing-newline-no-overflow", !logPayloadOverflows(atLines + "\n"));
eq("trailing-newline-clamp", clampLogPayload(atLines + "\n"), atLines + "\n");
pin("past-lines-overflow", logPayloadOverflows(atLines + "\nfour"));
eq("past-lines-clamp", clampLogPayload(atLines + "\nfour"), atLines);

// Both budgets: lines are cut first, then chars — a long
// first line clamps on chars alone; a many-lined payload
// clamps on lines even when short in chars.
const longLine = "y".repeat(500);
eq("long-line-clamp", clampLogPayload(longLine), "y".repeat(LOG_PAYLOAD_MAX_CHARS));
const manyShort = Array.from({ length: 10 }, (_, i) => `l${i}`).join("\n");
eq("many-lines-clamp", clampLogPayload(manyShort), "l0\nl1\nl2");
const mixed = `${"z".repeat(200)}\n${"z".repeat(200)}\n${"z".repeat(200)}`;
eq("mixed-clamp", clampLogPayload(mixed), mixed.slice(0, LOG_PAYLOAD_MAX_CHARS));

// The clamp is a strict prefix of the payload in every
// shape, and idempotent (clamping a clamp changes
// nothing, and a clamped payload never overflows).
const shapes = [
  "",
  "a",
  atChars,
  pastChars,
  atLines,
  atLines + "\n",
  atLines + "\nfour",
  longLine,
  manyShort,
  mixed,
  "exec bash -c echo \"base staged_by_name: $(git grep -c staged_by_name b3aff8a9 -- packages/services/src/catalog/admin/catalog-admin-view.ts 2>/dev/null || echo 0)\"; echo \"form staged_by_name: $(git grep -c staged_by_name 0ffd980a -- packages/services/src/catalog/admin/catalog-admin-view.ts 2>/dev/null || echo 0)\" by steampower — ok exit 0",
];
for (const [i, s] of shapes.entries()) {
  const c = clampLogPayload(s);
  pin(`prefix-${i}`, s.startsWith(c), `clamp is not a prefix of shape ${i}`);
  eq(`idempotent-${i}`, clampLogPayload(c), c);
  pin(`clamped-never-overflows-${i}`, !logPayloadOverflows(c));
  pin(`overflow-iff-differs-${i}`, logPayloadOverflows(s) === (c !== s));
}

if (failures > 0) {
  console.log(`verify-log-payload: ${failures} pin(s) FAILED`);
  process.exit(1);
}
console.log("verify-log-payload: all pins hold");
