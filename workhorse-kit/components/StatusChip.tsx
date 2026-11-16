// StatusChip — the status system rendered as a chip
// (kit sheet, content family; kit gap K1, closed
// 2026-11-13): a tone word with its dot, on the contract 06
// tone mapping the apps already share — ok / info / warn /
// fail ride the status table's hue + per-mode text
// variables (done / canonical / stale / hard-gate), idle
// is the sunken neutral. Not the Chip component: Chip
// renders the VOC1 ruled-status table (glyph + word) and
// nothing else.
//
// Form discipline inherited from the row cures: the chip
// is flex-none in every row family, paid for first, and
// can never clip; its label truncates only inside the
// chip's own box under genuine pressure. The pressable
// form (a filter / action chip) is a button and stops
// propagation, so a chip inside a row button never fires
// the row.
import { type CSSProperties } from "react";

export type StatusTone = "ok" | "info" | "warn" | "fail" | "idle";

const TONE_HUE: Record<Exclude<StatusTone, "idle">, string> = {
  ok: "var(--wb-status-done)",
  info: "var(--wb-status-canonical)",
  warn: "var(--wb-status-stale)",
  fail: "var(--wb-status-hard-gate)",
};

const TONE_TEXT: Record<Exclude<StatusTone, "idle">, string> = {
  ok: "var(--wb-status-done-text)",
  info: "var(--wb-status-canonical-text)",
  warn: "var(--wb-status-stale-text)",
  fail: "var(--wb-status-hard-gate-text)",
};

export type StatusChipProps = {
  tone: StatusTone;
  label: string;
  /** Present ⇒ pressable form (a button). */
  onPress?: () => void;
  /** The glance size (larger padding + text). */
  large?: boolean;
  className?: string;
};

export function StatusChip({ tone, label, onPress, large = false, className }: StatusChipProps) {
  const style: CSSProperties =
    tone === "idle"
      ? {
          backgroundColor: "var(--wb-surface-sunken)",
          color: "var(--wb-content-secondary)",
          borderRadius: "var(--wb-chip-radius)",
        }
      : {
          backgroundColor: `color-mix(in srgb, ${TONE_HUE[tone]} 14%, transparent)`,
          color: TONE_TEXT[tone],
          borderRadius: "var(--wb-chip-radius)",
        };
  const inner = (
    <>
      <span
        aria-hidden="true"
        className="inline-block h-[7px] w-[7px] shrink-0 rounded-full"
        style={{
          backgroundColor: tone === "idle" ? "var(--wb-content-muted)" : TONE_HUE[tone],
        }}
      />
      <span className="truncate">{label}</span>
    </>
  );
  const classes = [
    "inline-flex max-w-full items-center gap-1.5 overflow-hidden whitespace-nowrap",
    large ? "px-3.5 py-1.5 text-sm font-semibold" : "px-2.5 py-[2.5px] text-xs font-semibold",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  if (onPress) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPress();
        }}
        className={`${classes} cursor-pointer border-0 focus-visible:outline-2 focus-visible:outline-(--wb-focus-ring)`}
        style={style}
      >
        {inner}
      </button>
    );
  }
  return (
    <span className={classes} style={style}>
      {inner}
    </span>
  );
}
