// Checkbox + Radio — the kit's selection controls (kit
// gap K1, closed 2026-11-13: the kit had neither; the
// workbench hand-rolled the todo checkbox twice, the
// attention app hand-rolled its radio rows). Both render
// as <button> with the ARIA role, so Space/Enter work
// natively; group semantics (radiogroup, arrow keys) are
// the consumer's wrapper, as with RadioRow.
//
// Checkbox geometry — the owner's tick lesson
// (2026-11-13): the control is a CIRCLE whose box is
// LOCKED. Width, height, min and max are all pinned to
// the one size, flex is 0 0 auto, and align-self is set —
// so no parent row height (a two-line todo) and no global
// button rule (a min-height) can stretch it into an
// ellipse. That defect shipped once in the shell's fake,
// where an unlocked 24px tick was forced 24×32; the lock
// below is the cure stated as the component's contract,
// and Radio carries the same lock for the same reason.
// The locked size is 24px (2026-11-15 mobile critic): the
// 24px minimum target — the earlier 22px box measured
// 2px under it on every consumer row.
//
// Labels: the bare controls carry their label as the
// accessible name ONLY — no visible text. That is the
// right form beside visible row text (a todo's title).
// In a form group, where the label is the only thing
// naming the option, use LabeledCheckbox below: the
// circle plus its label as visible text, the whole row
// the tap target. A bare Checkbox dropped into a form
// ships a column of empty circles (2026-11-15 critic,
// the attention rule editor: 15 of 15 unlabelled).
import { type CSSProperties } from "react";

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
  /** The accessible name (the todo's title, the option). */
  label: string;
  disabled?: boolean;
  className?: string;
};

/** Checkbox — a circle, 24px, done-green when checked
 *  (the status table's done hue), white check. */
export function Checkbox({ checked, onChange, label, disabled = false, className }: CheckboxProps) {
  const style: CSSProperties = {
    ...LOCKED_BOX(24),
    backgroundColor: checked ? "var(--wb-status-done)" : "transparent",
    border: `2px solid ${checked ? "var(--wb-status-done)" : "var(--wb-field-border)"}`,
    color: "#fff",
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
        "wb-checkbox flex items-center justify-center focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-1 focus-visible:outline-(--wb-focus-ring)",
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
 *  locked circle, accent ring and center dot when
 *  checked. For a full-width option row with a checkmark,
 *  see RadioRow in GroupedList.tsx. */
export function Radio({ checked, onSelect, label, disabled = false, className }: RadioProps) {
  const style: CSSProperties = {
    ...LOCKED_BOX(24),
    backgroundColor: "transparent",
    border: `2px solid ${checked ? "var(--wb-accent)" : "var(--wb-field-border)"}`,
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
        "flex items-center justify-center focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-1 focus-visible:outline-(--wb-focus-ring)",
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
          style={{ width: 10, height: 10, flex: "0 0 10px", backgroundColor: "var(--wb-accent)" }}
        />
      ) : null}
    </button>
  );
}

export type LabeledCheckboxProps = {
  /** The label, rendered as visible text beside the
   *  circle and carried as the control's accessible name. */
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

/** LabeledCheckbox — the form-group form of Checkbox:
 *  the locked circle plus its label as visible text, the
 *  whole 40px row the tap target. The circle's own click
 *  stops propagation in the kit control, so a tap on the
 *  circle toggles once (there) and a tap on the text
 *  toggles once (here). Adopted into the kit 2026-11-15
 *  from the attention app's consumption form, which the
 *  mobile critic pass proved at 15 sites; the app's local
 *  copy retires onto this one. */
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
