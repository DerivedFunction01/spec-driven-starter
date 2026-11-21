// Button — the kit's only button. Sections never hand-roll one.
// Variants × states per context/component-contracts.md#button.
// Labels never truncate: no nowrap / overflow clipping anywhere
// in the chain — a squeezed button wraps its label and grows
// (owner rule, 2026-11-17: a truncated button is a defect,
// cured by sizing/layout, never by clipping).
import { type CSSProperties, type MouseEvent, type ReactNode, useState } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export type ButtonProps = {
  variant?: ButtonVariant;
  /** Icon-only (row actions). Requires ariaLabel; never for destructive/disposition actions. */
  iconOnly?: boolean;
  ariaLabel?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
};

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-1 focus-visible:outline-(--wb-focus-ring)";

function variantStyle(variant: ButtonVariant, hover: boolean, active: boolean): CSSProperties {
  const base: CSSProperties = { borderRadius: "var(--wb-button-radius)" };
  switch (variant) {
    case "primary":
      return {
        ...base,
        backgroundColor: active
          ? "color-mix(in srgb, var(--wb-accent) 88%, var(--wb-press-shade))"
          : hover
            ? "var(--wb-accent-hover)"
            : "var(--wb-accent)",
        color: "var(--wb-on-accent)",
        borderWidth: 0,
      };
    case "danger":
      return {
        ...base,
        backgroundColor: active
          ? "color-mix(in srgb, var(--wb-danger) 78%, var(--wb-press-shade))"
          : hover
            ? "color-mix(in srgb, var(--wb-danger) 88%, var(--wb-press-shade))"
            : "var(--wb-danger)",
        color: "var(--wb-on-accent)",
        borderWidth: 0,
      };
    case "secondary":
      return {
        ...base,
        backgroundColor: active
          ? "var(--wb-surface-sunken)"
          : hover
            ? "var(--wb-surface-1)"
            : "var(--wb-surface-2)",
        color: "var(--wb-content-primary)",
        borderColor: "var(--wb-field-border)",
        borderStyle: "solid",
        borderWidth: 1,
      };
    case "ghost":
      return {
        ...base,
        backgroundColor: active
          ? "var(--wb-surface-sunken)"
          : hover
            ? "var(--wb-surface-1)"
            : "transparent",
        color: hover || active ? "var(--wb-content-primary)" : "var(--wb-content-secondary)",
        borderWidth: 0,
      };
  }
}

export function Button({
  variant = "primary",
  iconOnly = false,
  ariaLabel,
  type = "button",
  disabled = false,
  onClick,
  className,
  children,
}: ButtonProps) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  if (iconOnly && !ariaLabel) {
    throw new Error("Button: iconOnly requires ariaLabel");
  }
  const classes = [
    "inline-flex min-h-[38px] max-w-full min-w-0 items-center justify-center gap-2 text-center text-sm font-medium select-none [@media(pointer:coarse)]:min-h-[44px]",
    iconOnly ? "w-[38px] px-0 [@media(pointer:coarse)]:w-[44px]" : "px-4",
    disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer",
    FOCUS,
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const track = (e: MouseEvent<HTMLButtonElement>) => {
    if (e.type === "mouseenter") setHover(true);
    if (e.type === "mouseleave") {
      setHover(false);
      setActive(false);
    }
    if (e.type === "mousedown") setActive(true);
    if (e.type === "mouseup") setActive(false);
  };

  return (
    <button
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
      onMouseEnter={track}
      onMouseLeave={track}
      onMouseDown={track}
      onMouseUp={track}
      className={classes}
      style={variantStyle(variant, !disabled && hover, !disabled && active)}
    >
      {typeof children === "string" ? (
        <span className="min-w-0 [overflow-wrap:anywhere]">{children}</span>
      ) : Array.isArray(children) ? (
        children.map((child, i) =>
          typeof child === "string" ? (
            <span key={i} className="min-w-0 [overflow-wrap:anywhere]">
              {child}
            </span>
          ) : (
            child
          ),
        )
      ) : (
        children
      )}
    </button>
  );
}
