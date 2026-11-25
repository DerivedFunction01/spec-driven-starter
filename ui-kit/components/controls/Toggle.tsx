// Toggle — one boolean, rendered as <button role="switch"> so
// Space/Enter toggle natively. Contract: context/component-contracts.md#toggle.
import { type CSSProperties, useState } from "react";

export type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
};

export function Toggle({ checked, onChange, label, disabled = false, className }: ToggleProps) {
  const [hover, setHover] = useState(false);
  const trackStyle: CSSProperties = checked
    ? {
        backgroundColor: hover && !disabled ? "var(--ui-accent-hover)" : "var(--ui-accent)",
        borderWidth: 0,
        borderRadius: "var(--ui-radius-pill)",
        transitionDuration: "var(--ui-motion-duration-pop)",
        transitionTimingFunction: "var(--ui-motion-ease)",
      }
    : {
        backgroundColor: "var(--ui-surface-sunken)",
        borderColor: hover && !disabled ? "var(--ui-accent)" : "var(--ui-field-border)",
        borderStyle: "solid",
        borderWidth: 1,
        borderRadius: "var(--ui-radius-pill)",
        transitionDuration: "var(--ui-motion-duration-pop)",
        transitionTimingFunction: "var(--ui-motion-ease)",
      };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      // `relative` is load-bearing, not cosmetic: the
      // label span below is absolutely positioned
      // whenever a consumer visually hides it (the
      // GroupedList switch row passes
      // [&>span:last-of-type]:sr-only). Without a
      // positioned ancestor the span's containing block
      // escapes to the page's outer scroller and its
      // static position deep in a scroll region extends
      // that scroller's overflow — the phantom body
      // scroll of owner defect D5. The
      // button as containing block keeps the span's
      // overflow inside the region that owns the row.
      className={[
        "ui-toggle group relative inline-flex min-h-[38px] items-center gap-2 focus-visible:outline-none [@media(pointer:coarse)]:min-h-[44px]",
        disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        aria-hidden="true"
        className="ui-toggle-track relative inline-block h-6 w-10 shrink-0 group-focus-visible:outline-2 group-focus-visible:outline-solid group-focus-visible:outline-offset-1 group-focus-visible:outline-(--ui-focus-ring)"
        style={trackStyle}
      >
        <span
          aria-hidden="true"
          className="absolute top-1/2 inline-block h-[18px] w-[18px] rounded-full"
          style={{
            backgroundColor: checked ? "var(--ui-on-accent)" : "var(--ui-surface-2)",
            left: checked ? 19 : 3,
            transform: "translateY(-50%)",
            transitionDuration: "var(--ui-motion-duration-pop)",
            transitionTimingFunction: "var(--ui-motion-ease)",
            transitionProperty: "left",
          }}
        />
      </span>
      <span
        className="min-w-0 text-sm [overflow-wrap:anywhere]"
        style={{ color: disabled ? "var(--ui-content-secondary)" : "var(--ui-content-primary)" }}
      >
        {label}
      </span>
    </button>
  );
}
