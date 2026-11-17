// Toggle — one boolean, rendered as <button role="switch">
// so Space/Enter toggle natively. The button itself carries
// no outline; the track carries the focus ring (the
// group-focus-visible utilities below, on the kit's focus
// role). The ui-toggle / ui-toggle-track hook classes bind
// the kit-owned theme rule in the generated themes (the
// generator emits it): the rule restates the track ring and
// adds the inset on-accent separator, because the focus
// role sits on the accent scale and a checked track's fill
// IS the accent — the ring alone would camouflage against
// it (the gate prices the separator pair in Part 5a). The
// off-state track border spends the field-border role: the
// Step 5a census measured border-strong under the 3:1
// non-text bar on every ground and re-pointed it.
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
      className={[
        "ui-toggle group inline-flex min-h-[38px] items-center gap-2 focus-visible:outline-none [@media(pointer:coarse)]:min-h-[44px]",
        disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        aria-hidden="true"
        className="ui-toggle-track relative inline-block h-6 w-10 shrink-0 group-focus-visible:outline-2 group-focus-visible:outline-solid group-focus-visible:outline-offset-1 group-focus-visible:outline-(--ui-focus)"
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
