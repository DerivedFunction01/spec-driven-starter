// GroupedList — the iOS form vocabulary of the kit, one
// home: the inset grouped list and its rows — GroupLabel,
// Row, StatRow, SwitchRow, RadioRow, NoticeRow, ActionRow.
// Labels, values, and states arrive as data; the rows carry
// no per-app knowledge. Interactive controls inside the rows
// are the kit's own primitives (Toggle here; Button and
// SegmentedControl ride as row content).
//
// Row discipline: the label gets its own line and flexes
// across the full row width; nothing that must stay whole
// ever competes with it there. A badge rides that line only
// through the badge slot — flex-none, paid for first, it can
// never clip. Trailing content (`end`) rides the details
// line when a sub is present, right-aligned and flex-none,
// so the details text truncates and the trailing content
// never clips; with no sub it rides the label line.
//
// NoticeRow mix constants (mirrored as data in the contrast
// gate's Part 3, family C): the fail ground is the fail hue
// mixed 12% into surface-2; the warn ground is the warn hue
// mixed 20% into surface-2. A change here owes the gate the
// same change.
import { type CSSProperties, type ReactNode } from "react";
import { Toggle } from "./Toggle";

export const NOTICE_FAIL_TINT_PCT = 12;
export const NOTICE_WARN_TINT_PCT = 20;

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-1 focus-visible:outline-(--ui-focus)";

/** The kit's chevron (8×13, 2px round-cap stroke), inline so
 *  the kit stays dependency-free. */
function Chevron() {
  return (
    <svg
      width="8"
      height="13"
      viewBox="0 0 8 13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className="shrink-0"
      style={{ color: "var(--ui-content-muted)" }}
    >
      <path d="M1.5 1.5 6.5 6.5 1.5 11.5" />
    </svg>
  );
}

function Check({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function AlertMark() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-[1px] shrink-0"
    >
      <path d="M12 4 22 20H2Z" />
      <path d="M12 10v4" />
      <path d="M12 17.5h.01" />
    </svg>
  );
}

export type GroupedListProps = {
  children: ReactNode;
  className?: string;
};

/** The inset grouped list: one surface, hairline dividers
 *  between children (any children — the family's rows or a
 *  consumer's own rows). */
export function GroupedList({ children, className }: GroupedListProps) {
  return (
    <div
      className={[
        "overflow-hidden [&>*+*]:[border-top:1px_solid_var(--ui-border-default)]",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        backgroundColor: "var(--ui-surface-2)",
        borderColor: "var(--ui-border-default)",
        borderStyle: "solid",
        borderWidth: 1,
        borderRadius: "var(--ui-radius-lg)",
      }}
    >
      {children}
    </div>
  );
}

export function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <div
      className="mt-5 mb-2 ml-[2px] text-xs font-bold tracking-[0.07em] uppercase first:mt-0"
      style={{ color: "var(--ui-content-secondary)" }}
    >
      {children}
    </div>
  );
}

export type RowProps = {
  label: ReactNode;
  /** The details line: full width beneath the label. */
  sub?: ReactNode;
  /** Line-1 badge slot (entity form): flex-none, beside the
   *  label, never clipped. */
  badge?: ReactNode;
  /** Trailing content — rides the details line when `sub`
   *  is present, else the label line. Flex-none. */
  end?: ReactNode;
  chevron?: boolean;
  /** Present ⇒ the row is the open action (a button). */
  onClick?: () => void;
  className?: string;
};

export function Row({ label, sub, badge, end, chevron = false, onClick, className }: RowProps) {
  const hasSub = !!sub;
  const trailing = end ? (
    <div className="ml-auto flex flex-none items-center gap-2">{end}</div>
  ) : null;
  const content = (
    <div className="min-w-0 flex-1">
      <div className="flex flex-nowrap items-center gap-3">
        <div
          className="min-w-0 flex-1 truncate text-[14.5px] font-medium"
          style={{ color: "var(--ui-content-primary)" }}
        >
          {label}
        </div>
        {badge ? <span className="flex flex-none items-center">{badge}</span> : null}
        {hasSub ? null : trailing}
        {chevron ? <Chevron /> : null}
      </div>
      {hasSub ? (
        <div className="flex flex-nowrap items-center gap-2">
          <div
            className="min-w-0 flex-1 truncate text-[12.5px]"
            style={{ color: "var(--ui-content-secondary)" }}
          >
            {sub}
          </div>
          {trailing}
        </div>
      ) : null}
    </div>
  );
  const classes = [
    "flex min-h-[47px] w-full flex-nowrap items-center gap-3 px-3.5 py-[11px] text-left",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${classes} cursor-pointer border-0 bg-transparent hover:bg-(--ui-surface-1) ${FOCUS}`}
      >
        {content}
      </button>
    );
  }
  return <div className={classes}>{content}</div>;
}

export type StatRowProps = {
  label: string;
  children: ReactNode;
};

/** StatRow — label/value facts: label left, value
 *  right-aligned, anywhere-wrapping. */
export function StatRow({ label, children }: StatRowProps) {
  return (
    <div className="flex min-h-[47px] min-w-0 items-center gap-3 px-3.5 py-[11px]">
      <span
        className="shrink-0 text-[14.5px] font-medium"
        style={{ color: "var(--ui-content-primary)" }}
      >
        {label}
      </span>
      <span
        className="ml-auto flex min-w-0 items-center gap-2 text-right text-sm [overflow-wrap:anywhere]"
        style={{ color: "var(--ui-content-secondary)" }}
      >
        {children}
      </span>
    </div>
  );
}

export type SwitchRowProps = {
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

/** SwitchRow — a labelled row whose control is the kit
 *  Toggle. The row carries the visible label; the Toggle's
 *  own label span is visually hidden (it stays in the
 *  accessibility tree as the switch's name). */
export function SwitchRow({ label, sub, checked, onChange, disabled = false }: SwitchRowProps) {
  return (
    <div className="flex min-h-[47px] w-full flex-nowrap items-center gap-3 px-3.5 py-[11px]">
      <div className="min-w-0 flex-1">
        <div
          className="truncate text-[14.5px] font-medium"
          style={{ color: "var(--ui-content-primary)" }}
        >
          {label}
        </div>
        {sub ? (
          <div
            className="truncate text-[12.5px]"
            style={{ color: "var(--ui-content-secondary)" }}
          >
            {sub}
          </div>
        ) : null}
      </div>
      <span className="flex flex-none items-center">
        <Toggle
          label={label}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="[&>span:last-of-type]:sr-only"
        />
      </span>
    </div>
  );
}

export type RadioRowProps = {
  label: string;
  sub?: string;
  selected: boolean;
  onSelect: () => void;
};

/** RadioRow (the checkmark form) — one option of a
 *  single-choice group: label + sub-line, an accent
 *  checkmark when selected. The consumer wraps the group
 *  in role="radiogroup". For a standalone round radio
 *  control outside a row, see Radio in Checkbox.tsx. */
export function RadioRow({ label, sub, selected, onSelect }: RadioRowProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex min-h-[47px] w-full cursor-pointer flex-nowrap items-center gap-3 border-0 bg-transparent px-3.5 py-[11px] text-left hover:bg-(--ui-surface-1) ${FOCUS}`}
    >
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-[14.5px] font-medium"
          style={{ color: "var(--ui-content-primary)" }}
        >
          {label}
        </span>
        {sub ? (
          <span
            className="block truncate text-[12.5px]"
            style={{ color: "var(--ui-content-secondary)" }}
          >
            {sub}
          </span>
        ) : null}
      </span>
      {selected ? (
        <span className="flex-none" style={{ color: "var(--ui-accent)" }}>
          <Check size={18} strokeWidth={2.6} />
        </span>
      ) : null}
    </button>
  );
}

export type NoticeRowProps = {
  /** Bold lead-in, before the text. */
  title?: string;
  children: ReactNode;
  tone?: "warn" | "fail";
};

/** NoticeRow — the banner as a row above the groups. Warn
 *  is the standing form; fail is the alert form. The text
 *  spends the tone's status-text token on the tone's tint
 *  ground (see the mix constants at the top of this file). */
export function NoticeRow({ title, children, tone = "warn" }: NoticeRowProps) {
  const style: CSSProperties =
    tone === "fail"
      ? {
          backgroundColor: `color-mix(in srgb, var(--ui-status-fail) ${NOTICE_FAIL_TINT_PCT}%, var(--ui-surface-2))`,
          borderColor: "var(--ui-status-fail)",
          borderStyle: "solid",
          borderWidth: 1,
          color: "var(--ui-status-fail-text)",
        }
      : {
          backgroundColor: `color-mix(in srgb, var(--ui-status-warn) ${NOTICE_WARN_TINT_PCT}%, var(--ui-surface-2))`,
          borderColor: "var(--ui-status-warn)",
          borderStyle: "solid",
          borderWidth: 1,
          color: "var(--ui-status-warn-text)",
        };
  return (
    <div
      className="mb-[18px] flex items-start gap-[11px] rounded-xl px-3.5 py-3 text-sm"
      style={style}
      role={tone === "fail" ? "alert" : "status"}
    >
      <AlertMark />
      <span className="min-w-0 [overflow-wrap:anywhere]">
        {title ? <b className="font-bold">{title}</b> : null}
        {title ? " " : null}
        {children}
      </span>
    </div>
  );
}

export type ActionRowProps = {
  label: string;
  danger?: boolean;
  onClick: () => void;
};

/** ActionRow — a full-width action in a group, accent text,
 *  with a danger variant spending the fail text token. */
export function ActionRow({ label, danger = false, onClick }: ActionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[47px] w-full cursor-pointer items-center border-0 bg-transparent px-3.5 py-[11px] text-left hover:bg-(--ui-surface-1) ${FOCUS}`}
    >
      <span
        className="min-w-0 truncate text-[14.5px] font-semibold"
        style={{ color: danger ? "var(--ui-status-fail-text)" : "var(--ui-accent)" }}
      >
        {label}
      </span>
    </button>
  );
}
