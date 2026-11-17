// Button — the kit's only button. Sections never hand-roll
// one. Variants spend the tokens' solid pairs: primary rides
// accent / on-accent, danger rides danger / on-accent (the
// danger pair's priced foreground in the generic tokens is
// on-accent), secondary and ghost ride the surfaces with
// content-primary text. Secondary's border spends the
// field-border role (the Step 5a census re-pointed it from
// border-strong, which measures under the 3:1 non-text bar
// on every ground). The ui-button hook class and the
// data-variant attribute bind the kit-owned theme rule the
// generator emits: on the solid variants (primary, danger)
// the rule adds the inset on-accent separator band, because
// the focus role sits on the accent scale and the ring
// alone camouflages against the fill (the gate prices the
// separator pair in Part 5a).
//
// COMPONENT MIX CONSTANTS — mirrored as data in the
// contrast gate's Part 5b extension (Step 6 of the governing
// plan); a change here owes the gate the same change, in
// the same change. The press endpoint is the primitive
// --ui-black token: the generic tokens carry no mode-aware
// press-shade role (a recorded finding — the source kit's
// press-shade token resolves black in light, white in
// dark). Until that token decision lands, the press mixes
// below shade toward black in both modes.
//   BUTTON_PRIMARY_ACTIVE_MIX_PCT = 88  (accent toward press)
//   BUTTON_DANGER_HOVER_MIX_PCT    = 88  (danger toward press)
//   BUTTON_DANGER_ACTIVE_MIX_PCT   = 78  (danger toward press)
import { type CSSProperties, type MouseEvent, type ReactNode, useState } from "react";

export const BUTTON_PRIMARY_ACTIVE_MIX_PCT = 88;
export const BUTTON_DANGER_HOVER_MIX_PCT = 88;
export const BUTTON_DANGER_ACTIVE_MIX_PCT = 78;

const PRESS_ENDPOINT = "var(--ui-black)";

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
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-1 focus-visible:outline-(--ui-focus)";

function variantStyle(variant: ButtonVariant, hover: boolean, active: boolean): CSSProperties {
  const base: CSSProperties = { borderRadius: "var(--ui-button-radius)" };
  switch (variant) {
    case "primary":
      return {
        ...base,
        backgroundColor: active
          ? `color-mix(in srgb, var(--ui-accent) ${BUTTON_PRIMARY_ACTIVE_MIX_PCT}%, ${PRESS_ENDPOINT})`
          : hover
            ? "var(--ui-accent-hover)"
            : "var(--ui-accent)",
        color: "var(--ui-on-accent)",
        borderWidth: 0,
      };
    case "danger":
      return {
        ...base,
        backgroundColor: active
          ? `color-mix(in srgb, var(--ui-danger) ${BUTTON_DANGER_ACTIVE_MIX_PCT}%, ${PRESS_ENDPOINT})`
          : hover
            ? `color-mix(in srgb, var(--ui-danger) ${BUTTON_DANGER_HOVER_MIX_PCT}%, ${PRESS_ENDPOINT})`
            : "var(--ui-danger)",
        color: "var(--ui-on-accent)",
        borderWidth: 0,
      };
    case "secondary":
      return {
        ...base,
        backgroundColor: active
          ? "var(--ui-surface-sunken)"
          : hover
            ? "var(--ui-surface-1)"
            : "var(--ui-surface-2)",
        color: "var(--ui-content-primary)",
        borderColor: "var(--ui-field-border)",
        borderStyle: "solid",
        borderWidth: 1,
      };
    case "ghost":
      return {
        ...base,
        backgroundColor: active
          ? "var(--ui-surface-sunken)"
          : hover
            ? "var(--ui-surface-1)"
            : "transparent",
        color: hover || active ? "var(--ui-content-primary)" : "var(--ui-content-secondary)",
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
    "ui-button inline-flex min-h-[38px] max-w-full min-w-0 items-center justify-center gap-2 overflow-hidden text-sm font-medium whitespace-nowrap select-none [@media(pointer:coarse)]:min-h-[44px]",
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
      data-variant={variant}
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
        <span className="min-w-0 truncate">{children}</span>
      ) : Array.isArray(children) ? (
        children.map((child, i) =>
          typeof child === "string" ? (
            <span key={i} className="min-w-0 truncate">
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
