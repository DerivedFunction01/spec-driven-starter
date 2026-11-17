// StatusChip — a status of the generic tier rendered as a
// chip: a tone word with its dot, the hue as the dot and
// tint, the tone's per-mode text token as the word. Idle is
// the sunken neutral. Not the Badge: the Badge is the
// mix-form (hue-mixed text on a 16% tint); this chip spends
// the priced text token on the 14% tint.
//
// TINT CONSTANTS — mirrored as data in the contrast gate's
// Part 3, family A; a change here owes the gate the same
// change, in the same change:
//   CHIP_TINT_PCT         = 14  (resting tint)
//   CHIP_PRESSED_TINT_PCT = 22  (the pressable form, pressed)
//
// Form discipline: the chip is flex-none in every row
// family, paid for first, and can never clip; its label
// truncates only inside the chip's own box under genuine
// pressure. The pressable form is a button and stops
// propagation, so a chip inside a row button never fires
// the row. The pill stays 24px; the pressable form's target
// is the full contract height via a transparent hit-area
// span, so the target grows without the pill growing.
import { type CSSProperties } from "react";

export const CHIP_TINT_PCT = 14;
export const CHIP_PRESSED_TINT_PCT = 22;

export type StatusTone = "ok" | "info" | "warn" | "fail" | "stale" | "idle";

export type StatusChipProps = {
  tone: StatusTone;
  label: string;
  /** Present ⇒ pressable form (a button). */
  onPress?: () => void;
  /** Filter-chip form; meaningful only with onPress. Spends
   *  the pressed tint step. */
  pressed?: boolean;
  /** The glance size (larger padding + text). */
  large?: boolean;
  className?: string;
};

const GROUP_FOCUS =
  "group-focus-visible:outline-2 group-focus-visible:outline-solid group-focus-visible:outline-offset-1 group-focus-visible:outline-(--ui-focus)";

export function StatusChip({
  tone,
  label,
  onPress,
  pressed = false,
  large = false,
  className,
}: StatusChipProps) {
  const style: CSSProperties =
    tone === "idle"
      ? {
          backgroundColor: "var(--ui-surface-sunken)",
          color: "var(--ui-content-secondary)",
          borderRadius: "var(--ui-chip-radius)",
        }
      : {
          backgroundColor: `color-mix(in srgb, var(--ui-status-${tone}) ${pressed ? CHIP_PRESSED_TINT_PCT : CHIP_TINT_PCT}%, transparent)`,
          color: `var(--ui-status-${tone}-text)`,
          borderRadius: "var(--ui-chip-radius)",
        };
  const inner = (
    <>
      <span
        aria-hidden="true"
        className="inline-block h-[7px] w-[7px] shrink-0 rounded-full"
        style={{
          backgroundColor: tone === "idle" ? "var(--ui-content-muted)" : `var(--ui-status-${tone})`,
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
        aria-pressed={pressed}
        onClick={(e) => {
          e.stopPropagation();
          onPress();
        }}
        className="group relative inline-flex max-w-full min-w-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 focus-visible:outline-none"
        style={{ minHeight: "38px" }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 h-[38px] -translate-y-1/2 [@media(pointer:coarse)]:h-[44px]"
        />
        <span className={`${classes} ${GROUP_FOCUS}`} style={style}>
          {inner}
        </span>
      </button>
    );
  }
  return (
    <span className={classes} style={style}>
      {inner}
    </span>
  );
}
