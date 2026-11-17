// SegmentedControl — one choice from a small enum, built on
// NATIVE radio inputs (visually hidden, labels styled as
// segments): the radio group gives the WAI-APG pattern for
// free — one Tab stop per group, arrow keys move + select.
// The primitive under ModeControl, PaletteSelect (few-option
// form), DensityToggle and StateControls select fields.
// Contract: context/component-contracts.md#segmentedcontrol.
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

// Wrap guarantee (contract: context/component-contracts.md
// #segmentedcontrol): no `whitespace-nowrap` — a segment's
// label wraps INSIDE its pill, and `min-w-0` on the label
// and the span lets the pill shrink to the fieldset's
// width instead of painting past it. Short labels are
// unaffected: they still render single-line exactly as
// before. The span carries vertical padding (py-1.5) so a
// wrapped label never sits against the pill's border
// (2026-11-15 critic R2: a 3-line stress label measured
// 1.0px from the top border); single-line pills are
// unchanged — their height is the min-height either way.
//
// Focus: the radio is visually hidden, so the segment
// carries the focus indication — the peer-focus-visible
// utilities below, and the kit-owned rule in the generated
// themes (.wb-segmented-input:focus-visible +
// .wb-segmented-segment) that holds even where a consumer's
// Tailwind build never generated the peer utilities.
//
// Target size: the pill is the visible control, and the
// label wrapping it is the native radio's hit area — both
// carry the control's full contract height (38px, 44px
// coarse) so the measured target IS the pill, not a 30px
// box inside a 38px fieldset (the 2026-11-10 critic's F2
// leg for this primitive). The fieldset's padding drops to
// zero so the track hugs the pills at the same height.
const SEGMENT_CLASSES = [
  "inline-flex min-h-[38px] max-w-full min-w-0 cursor-pointer items-center rounded-[var(--wb-radius-sm)] border border-transparent px-3 py-1.5 text-sm [overflow-wrap:anywhere] [@media(pointer:coarse)]:min-h-[44px]",
  "text-(--wb-content-secondary) hover:text-(--wb-content-primary)",
  "peer-checked:border-(--wb-field-border) peer-checked:bg-(--wb-surface-2) peer-checked:font-semibold peer-checked:text-(--wb-content-primary)",
  "peer-focus-visible:outline-2 peer-focus-visible:outline-solid peer-focus-visible:outline-offset-1 peer-focus-visible:outline-(--wb-focus-ring)",
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
      // pills when the options outrun it (at 390px: the
      // Changes worktree picker, the Inbox state filter).
      // Inert whenever the options fit on one line, as on
      // the desktop canvas.
      style={{
        backgroundColor: "var(--wb-surface-sunken)",
        borderRadius: "var(--wb-radius-sm)",
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
            className="peer sr-only wb-segmented-input"
          />
          <span className={`${SEGMENT_CLASSES} wb-segmented-segment`}>{opt.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
