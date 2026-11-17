// Fields — the kit's form controls: a native <select> and a
// native <input> under kit chrome, plus the Field labelled
// wrapper. Native semantics underneath: the browser's own
// behaviour (IME, autofill, screen readers, the platform
// picker) is the kit's, and the chrome is one appearance
// idiom, exported here so every form surface renders as one
// family and never drifts into per-surface copies.
//
// The boundary discipline (the generic kit's Part 5 lesson,
// priced by the contrast gate): the control spends the
// dedicated field-border role at rest AND on hover — never
// the decorative border-default hairline, and never
// border-strong, which measures under the 3:1 non-text bar
// on every ground (the gate's Part 5a census re-pointed the
// hover spend here); the focus ring spends the dedicated
// focus role — never the accent.
import {
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  useId,
} from "react";

/** The field appearance, shared by every kit form surface.
 * Inline style for the token plumbing (the kit's convention);
 * classes carry sizing and the disabled treatment. Width is
 * w-full: a field fills its container — without a width the
 * control renders at its intrinsic size and its value clips
 * inside wider form columns. A call site that needs a
 * narrower field constrains its container. The border color
 * is NOT in this static style: it is stateful in principle
 * (the controls below supply it); both states currently
 * spend field-border (see the boundary note above). */
export const FIELD_STYLE: CSSProperties = {
  backgroundColor: "var(--ui-surface-2)",
  color: "var(--ui-content-primary)",
  borderStyle: "solid",
  borderWidth: 1,
  borderRadius: "var(--ui-button-radius)",
};

export const FIELD_CLASSES =
  "min-h-[38px] w-full max-w-full min-w-0 px-3 text-sm focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-1 focus-visible:outline-(--ui-focus) disabled:cursor-not-allowed disabled:opacity-55 [@media(pointer:coarse)]:min-h-[44px]";

function fieldStyle(disabled: boolean, style?: CSSProperties): CSSProperties {
  return {
    ...FIELD_STYLE,
    backgroundColor: disabled ? "var(--ui-surface-1)" : "var(--ui-surface-2)",
    color: disabled ? "var(--ui-content-secondary)" : "var(--ui-content-primary)",
    borderColor: "var(--ui-field-border)",
    ...style,
  };
}

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string; disabled?: boolean }[];
  ariaLabel?: string;
};

/** A native select in kit chrome. Options are data, not
 * children, so every call site states its full option set
 * (including an explicit placeholder option when the field
 * starts unset). */
export function Select({ options, ariaLabel, className, style, disabled, ...rest }: SelectProps) {
  return (
    <select
      aria-label={ariaLabel}
      disabled={disabled}
      className={[FIELD_CLASSES, className ?? ""].filter(Boolean).join(" ")}
      style={fieldStyle(!!disabled, style)}
      {...rest}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  ariaLabel?: string;
};

/** A native text input in kit chrome (type="text" and
 * type="search" are the ruled forms; other types pass
 * through the same chrome). */
export function Input({ ariaLabel, className, style, disabled, ...rest }: InputProps) {
  return (
    <input
      aria-label={ariaLabel}
      disabled={disabled}
      className={[FIELD_CLASSES, className ?? ""].filter(Boolean).join(" ")}
      style={fieldStyle(!!disabled, style)}
      {...rest}
    />
  );
}

export type FieldProps = {
  /** The visible label, rendered in the kit label idiom
   * (12px uppercase secondary). */
  label: string;
  /** Visually hidden label instead (filter-bar groups,
   * where the group heading names the field). */
  labelHidden?: boolean;
  /** The control: a render prop receiving the generated
   * id, so any kit control binds to the label. */
  children: (id: string) => ReactNode;
  className?: string;
  style?: CSSProperties;
};

/** The labelled-field wrapper: a visible label bound to its
 * control by htmlFor. The label is a statement of what the
 * field IS; validation and consequence text live with the
 * control's section, never in the label. */
export function Field({ label, labelHidden = false, children, className, style }: FieldProps) {
  const id = useId();
  return (
    <label className={className} style={{ display: "block", ...style }} htmlFor={id}>
      <span
        className={labelHidden ? "sr-only" : undefined}
        style={
          labelHidden
            ? undefined
            : {
                display: "block",
                color: "var(--ui-content-secondary)",
                fontSize: "var(--ui-font-size-xs)",
                lineHeight: "var(--ui-line-height-xs)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "var(--ui-space-4)",
              }
        }
      >
        {label}
      </span>
      {children(id)}
    </label>
  );
}
