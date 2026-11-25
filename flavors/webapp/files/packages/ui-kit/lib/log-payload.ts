// log-payload — the LogRow payload clamp, as pure
// functions over the served string. The clamp decision is
// made HERE, from the payload itself (line count / char
// count against the budgets below), never from a DOM
// measurement: the same payload clamps the same way at
// every width, in every consumer, and the predicate is
// pinnable on fixture strings
// (tools/verify-log-payload.mjs).
//
// The clamp is always a strict prefix of the payload: the
// first LOG_PAYLOAD_MAX_LINES lines, further cut at
// LOG_PAYLOAD_MAX_CHARS chars. A payload equal to its own
// clamp does not overflow and renders exactly as served —
// no affordance, no visual change. (A single trailing
// newline belongs to the last line, not a line of its
// own, so a three-line payload that merely ends with one
// does not overflow.)

export const LOG_PAYLOAD_MAX_LINES = 3;
export const LOG_PAYLOAD_MAX_CHARS = 300;

export function clampLogPayload(text: string): string {
  const body = text.endsWith("\n") ? text.slice(0, -1) : text;
  let head = body.split("\n").slice(0, LOG_PAYLOAD_MAX_LINES).join("\n");
  if (head.length > LOG_PAYLOAD_MAX_CHARS) {
    head = head.slice(0, LOG_PAYLOAD_MAX_CHARS);
  }
  return head === body ? text : head;
}

export function logPayloadOverflows(text: string): boolean {
  return clampLogPayload(text) !== text;
}
