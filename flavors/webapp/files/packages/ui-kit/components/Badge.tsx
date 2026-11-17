// Badge — the mix badge on the generic status tier: a
// status word on its own hue's tint. `text` is required
// because a badge without its word is a defect.
//
// MIX CONSTANTS — mirrored as data in the contrast gate's
// Part 3, family B; a change here owes the gate the same
// change, in the same change:
//   BADGE_TINT_PCT     = 16  (hue tint under the text)
//   BADGE_FG_HUE_PCT   = 30  (hue share of the text mix;
//                             the rest is content-primary)
// The foreground step is 30, not the source kits' 43: the
// token-cure measurement showed 43 cannot clear the
// sage/dark badge pairs by any token move, and the gate's
// Part 3 family B carries 30 as its mirrored constant.
import type { CSSProperties } from "react";

export const BADGE_TINT_PCT = 16;
export const BADGE_FG_HUE_PCT = 30;

export type BadgeKind = "ok" | "info" | "warn" | "fail" | "stale" | "idle";

export type BadgeProps = {
  kind: BadgeKind;
  /** Word + magnitude, e.g. "Stale · 23d unverified". Required. */
  text: string;
  className?: string;
};

function badgeStyle(kind: BadgeKind): CSSProperties {
  const hue = `var(--ui-status-${kind})`;
  return {
    backgroundColor: `color-mix(in srgb, ${hue} ${BADGE_TINT_PCT}%, transparent)`,
    color: `color-mix(in srgb, ${hue} ${BADGE_FG_HUE_PCT}%, var(--ui-content-primary))`,
    borderWidth: 0,
    borderRadius: "var(--ui-chip-radius)",
  };
}

export function Badge({ kind, text, className }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex h-6 max-w-full min-w-0 items-center gap-1.5 px-2.5 text-xs font-medium whitespace-nowrap",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={badgeStyle(kind)}
    >
      <span
        aria-hidden="true"
        className="inline-block h-[7px] w-[7px] shrink-0 rounded-full"
        style={{ backgroundColor: `var(--ui-status-${kind})` }}
      />
      <span className="truncate">{text}</span>
    </span>
  );
}
