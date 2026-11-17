// Checkbox + Radio — the kit's selection controls. Both
// render as <button> with the ARIA role, so Space/Enter work
// natively; group semantics (radiogroup, arrow keys) are the
// consumer's wrapper, as with RadioRow.
//
// Checkbox geometry — the locked-box contract: the control
// is a CIRCLE whose box is LOCKED. Width, height, min and
// max are all pinned to the one size, flex is 0 0 auto, and
// align-self is set — so no parent row height and no global
// button rule can stretch it into an ellipse. That defect
// shipped once in a source kit (an unlocked 24px tick forced
// to 24×32); the lock below is the cure stated as the
// component's contract, and Radio carries the same lock for
// the same reason. The locked size is 24px: the 24px minimum
// target.
//
// Labels: the bare controls carry their label as the
// accessible name ONLY — no visible text. That is the right
// form beside visible row text. In a form group, where the
// label is the only thing naming the option, use
// LabeledCheckbox below: the circle plus its label as
// visible text, the whole row the tap target. A bare
// Checkbox dropped into a form ships a column of empty
// circles.
//
// Boundary note: the unchecked box spends the field-border
// role — the Step 5a spend census measured border-strong
// under the 3:1 non-text bar on every ground and re-pointed
// the spend here. The checked border spends the ok hue it
// fills with (co-extensive with the fill, not an independent
// boundary); the checked state is identified by the white
// check on that fill, a pair the gate prices in Part 5a.
import { type CSSProperties } from "react";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-1 focus-visible:outline-(--ui-focus)";

const LOCKED_BOX = (size: number): CSSProperties => ({
  width: size,
  height: size,
  minWidth: size,
  minHeight: size,
  maxWidth: size,
  maxHeight: size,
  flex: `0 0 ${size}px`,
  flexShrink: 0,
  alignSelf: "center",
  borderRadius: "50%",
});

export type CheckboxProps = {
  checked: boolean;
  /** Present ⇒ the box toggles. Absent ⇒ display-only. */
  onChange?: (checked: boolean) => void;
  /** The accessible name (the row's title, the option). */
  label: string;
  disabled?: boolean;
  className?: string;
};

/** Checkbox — a circle, 24px, ok-green when checked (the
 *  status tier's ok hue), white check. */
export function Checkbox({ checked, onChange, label, disabled = false, className }: CheckboxProps) {
  const style: CSSProperties = {
    ...LOCKED_BOX(24),
    backgroundColor: checked ? "var(--ui-status-ok)" : "transparent",
    border: `2px solid ${checked ? "var(--ui-status-ok)" : "var(--ui-field-border)"}`,
    color: "var(--ui-white)",
    padding: 0,
  };
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange?.(!checked);
      }}
      className={[
        `ui-checkbox flex items-center justify-center ${FOCUS}`,
        disabled ? "cursor-not-allowed opacity-55" : onChange ? "cursor-pointer" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {checked ? (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : null}
    </button>
  );
}

export type RadioProps = {
  checked: boolean;
  /** Present ⇒ selecting fires. Absent ⇒ display-only. */
  onSelect?: () => void;
  /** The accessible name (the option's label). */
  label: string;
  disabled?: boolean;
  className?: string;
};

/** Radio — the standalone round radio control: a 24px
 *  locked circle, accent ring and center dot when checked.
 *  For a full-width option row with a checkmark, see
 *  RadioRow in GroupedList.tsx. */
export function Radio({ checked, onSelect, label, disabled = false, className }: RadioProps) {
  const style: CSSProperties = {
    ...LOCKED_BOX(24),
    backgroundColor: "transparent",
    border: `2px solid ${checked ? "var(--ui-accent)" : "var(--ui-field-border)"}`,
    padding: 0,
  };
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      className={[
        `flex items-center justify-center ${FOCUS}`,
        disabled ? "cursor-not-allowed opacity-55" : onSelect ? "cursor-pointer" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {checked ? (
        <span
          aria-hidden="true"
          className="inline-block rounded-full"
          style={{ width: 10, height: 10, flex: "0 0 10px", backgroundColor: "var(--ui-accent)" }}
        />
      ) : null}
    </button>
  );
}

export type LabeledCheckboxProps = {
  /** The label, rendered as visible text beside the circle
   *  and carried as the control's accessible name. */
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

/** LabeledCheckbox — the form-group form of Checkbox: the
 *  locked circle plus its label as visible text, the whole
 *  40px row the tap target. The circle's own click stops
 *  propagation in the kit control, so a tap on the circle
 *  toggles once (there) and a tap on the text toggles once
 *  (here). */
export function LabeledCheckbox({
  label,
  checked,
  onChange,
  disabled = false,
  className,
}: LabeledCheckboxProps) {
  return (
    <div
      className={[
        "flex min-h-[40px] items-center gap-[10px]",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => {
        if (!disabled) onChange(!checked);
      }}
    >
      <Checkbox label={label} checked={checked} onChange={onChange} disabled={disabled} />
      <span className="text-sm">{label}</span>
    </div>
  );
}
