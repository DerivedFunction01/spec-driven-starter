// SegmentedControl — one choice from a small enum, built on
// NATIVE radio inputs (visually hidden, labels styled as
// segments): the radio group gives the WAI-APG pattern for
// free — one Tab stop per group, arrow keys move + select.
//
// Wrap guarantee: no `whitespace-nowrap` — a segment's label
// wraps INSIDE its pill, and `min-w-0` on the label and the
// span lets the pill shrink to the fieldset's width instead
// of painting past it. The span carries vertical padding
// (py-1.5) so a wrapped label never sits against the pill's
// border; single-line pills are unchanged — their height is
// the min-height either way.
//
// Focus: the radio is visually hidden, so the segment
// carries the focus indication — the peer-focus-visible
// utilities below on the kit's focus role, plus the
// ui-segmented-input / ui-segmented-segment hook classes,
// which bind the kit-owned theme rule the generator emits
// into the themes, so the guarantee holds even where a
// consumer's utility build never generated the peer
// utilities.
//
// Boundary: the checked segment spends the field-border
// role — the Step 5a census measured border-default under
// the 3:1 non-text bar on every ground and re-pointed the
// spend here; the checked state is identified by that
// border plus the surface-2 fill and the semibold text.
//
// Target size: the pill is the visible control, and the
// label wrapping it is the native radio's hit area — both
// carry the control's full contract height (38px, 44px
// coarse) so the measured target IS the pill. The
// fieldset's padding drops to zero so the track hugs the
// pills at the same height.
import { useId } from "react";

export type SegmentedOption<V extends string> = { value: V; label: string };

export type SegmentedControlProps<V extends string> = {
  options: SegmentedOption<V>[];
  value: V;
  onChange: (value: V) => void;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
};

const SEGMENT_CLASSES = [
  "inline-flex min-h-[38px] max-w-full min-w-0 cursor-pointer items-center rounded-[var(--ui-radius-sm)] border border-transparent px-3 py-1.5 text-sm [overflow-wrap:anywhere] [@media(pointer:coarse)]:min-h-[44px]",
  "text-(--ui-content-secondary) hover:text-(--ui-content-primary)",
  "peer-checked:border-(--ui-field-border) peer-checked:bg-(--ui-surface-2) peer-checked:font-semibold peer-checked:text-(--ui-content-primary)",
  "peer-focus-visible:outline-2 peer-focus-visible:outline-solid peer-focus-visible:outline-offset-1 peer-focus-visible:outline-(--ui-focus)",
  "peer-disabled:cursor-not-allowed",
].join(" ");

export function SegmentedControl<V extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  disabled = false,
  className,
}: SegmentedControlProps<V>) {
  const name = useId();
  return (
    <fieldset
      className={[
        "m-0 inline-flex min-h-[38px] flex-wrap items-center gap-1 border-0 p-0 [@media(pointer:coarse)]:min-h-[44px]",
        disabled ? "opacity-55" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      // A segmented control never paints outside its
      // container: clamped to the box and wrapping between
      // pills when the options outrun it. Inert whenever the
      // options fit on one line.
      style={{
        backgroundColor: "var(--ui-surface-sunken)",
        borderRadius: "var(--ui-radius-sm)",
        maxWidth: "100%",
      }}
    >
      <legend className="sr-only">{ariaLabel}</legend>
      {options.map((opt) => (
        <label
          key={opt.value}
          className="inline-flex min-h-[38px] max-w-full min-w-0 [@media(pointer:coarse)]:min-h-[44px]"
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={opt.value === value}
            disabled={disabled}
            onChange={() => onChange(opt.value)}
            className="peer sr-only ui-segmented-input"
          />
          <span className={`${SEGMENT_CLASSES} ui-segmented-segment`}>{opt.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
