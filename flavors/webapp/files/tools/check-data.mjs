// The composed check's ruled DATA tables. The scanning
// engines live in check.mjs, beside this file; they import
// the tables exported here. Argue a new exception here, in
// the open, or remove the code that needs it.
//
// Raw-element entries: every entry names its file, its
// element (a tag, or an input kind refined by its type
// attribute), why no designed component can serve it, and
// a machine-checkable claim the check re-proves every run.
// Claim types (a closed set — a new type is a change to
// check.mjs, argued in the open):
// - { type: "dress", cite: [{ stylesheet, selector }] }:
//   every cited stylesheet exists and carries every cited
//   selector.
// - { type: "carrier" }: an input[type=hidden] form-state
//   carrier; the file still holds one.
// - { type: "picker" }: an input[type=file] rendered
//   hidden, feeding a designed trigger.
// - { type: "standin" }: a deliberate stand-in surface;
//   file and element existence are the whole content.
// - { type: "labelled" }: every occurrence of the element
//   in the file carries an aria-label.
// An entry whose file or element is gone, whose claim is
// missing or broken, is itself a finding.
export const RAW_ELEMENT_ALLOWLIST = [];

// Dead-class entries: class name -> the named non-CSS
// consumer that needs the class (a JS query, a test
// selector, a contract with another system). An entry for
// a class that has gained a stylesheet definition, or is
// no longer referenced, is itself a finding.
export const DEAD_CLASS_ALLOWLIST = {};

// Value-slot entries: a slot ({ file, selector, reason })
// exempt from the never-clip contract only when its text
// is genuinely decorative — not a value a reader needs.
// An entry with an empty file, selector, or reason fails
// the check, and so does an entry whose slot no longer
// carries either clipping pattern.
export const VALUE_SLOT_ALLOWLIST = [];
