// GroupedList — the iOS form vocabulary of the kit sheet,
// one home (kit gap K1): the inset
// grouped list and its rows — GroupLabel, Row, StatRow,
// SwitchRow, RadioRow, NoticeRow, ActionRow. The four apps
// composed this family locally, in four dialects, from kit
// tokens; the forms here are the shipped consensus of those
// dialects (the scheduler's two-line Row discipline, the
// attention app's checkmark RadioRow, the runner's divider
// rule), stated once as pure form-model: labels, values,
// and states arrive as data, and the rows carry no per-app
// knowledge. Interactive controls inside the rows are the
// kit's own primitives (Toggle here; Button, SegmentedControl
// ride as row content).
//
// Row discipline (the owner's row ruling, from
// the lease-row and label-fix cures): the label gets its
// own line and flexes across the full row width; nothing
// that must stay whole ever competes with it there. A
// badge rides that line only through the badge slot —
// flex-none, paid for first, it can never clip (the entity
// form: the runner's lease rows, line 1 = title + badge,
// line 2 = details). Trailing content (`end`) rides the
// details line when a sub is present, right-aligned and
// flex-none, so the details text truncates and the chip
// never clips; with no sub it rides the label line.
import { type CSSProperties, type ReactNode } from "react";
import { Toggle } from "../controls/Toggle";

/** The kit's chevron — the same inline SVG LogRow carries
 *  (8×13, 2px round-cap stroke), so the kit stays
 *  dependency-free. */
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
      style={{ color: "var(--wb-content-muted)" }}
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
 *  between children (any children — the family's rows,
 *  LogRow, or a consumer's own rows). */
export function GroupedList({ children, className }: GroupedListProps) {
  return (
    <div
      className={[
        "overflow-hidden [&>*+*]:[border-top:1px_solid_var(--wb-border-default)]",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        backgroundColor: "var(--wb-surface-2)",
        borderColor: "var(--wb-border-default)",
        borderStyle: "solid",
        borderWidth: 1,
        borderRadius: "var(--wb-radius-lg)",
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
      style={{ color: "var(--wb-content-secondary)" }}
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

export function Row({
  label,
  sub,
  badge,
  end,
  chevron = false,
  onClick,
  className,
}: RowProps) {
  const hasSub = !!sub;
  const trailing = end ? (
    <div className="ml-auto flex flex-none items-center gap-2">{end}</div>
  ) : null;
  const content = (
    <div className="min-w-0 flex-1">
      <div className="flex flex-nowrap items-center gap-3">
        <div
          className="min-w-0 flex-1 truncate text-[14.5px] font-medium"
          style={{ color: "var(--wb-content-primary)" }}
        >
          {label}
        </div>
        {badge ? (
          <span className="flex flex-none items-center">{badge}</span>
        ) : null}
        {hasSub ? null : trailing}
        {chevron ? <Chevron /> : null}
      </div>
      {hasSub ? (
        <div className="flex flex-nowrap items-center gap-2">
          <div
            className="min-w-0 flex-1 truncate text-[12.5px]"
            style={{ color: "var(--wb-content-secondary)" }}
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
        className={`${classes} cursor-pointer border-0 bg-transparent hover:bg-(--wb-surface-1) focus-visible:outline-2 focus-visible:outline-(--wb-focus-ring)`}
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

/** StatRow — label/value facts (the kit sheet's StatRow):
 *  label left, value right-aligned, anywhere-wrapping. */
export function StatRow({ label, children }: StatRowProps) {
  return (
    <div className="flex min-h-[47px] min-w-0 items-center gap-3 px-3.5 py-[11px]">
      <span
        className="shrink-0 text-[14.5px] font-medium"
        style={{ color: "var(--wb-content-primary)" }}
      >
        {label}
      </span>
      <span
        className="ml-auto flex min-w-0 items-center gap-2 text-right text-sm [overflow-wrap:anywhere]"
        style={{ color: "var(--wb-content-secondary)" }}
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
 *  accessibility tree as the switch's name) — the
 *  composition every app hand-rolled, internalized here. */
export function SwitchRow({ label, sub, checked, onChange, disabled }: SwitchRowProps) {
  return (
    <div className="flex min-h-[47px] w-full flex-nowrap items-center gap-3 px-3.5 py-[11px]">
      <div className="min-w-0 flex-1">
        <div
          className="truncate text-[14.5px] font-medium"
          style={{ color: "var(--wb-content-primary)" }}
        >
          {label}
        </div>
        {sub ? (
          <div
            className="truncate text-[12.5px]"
            style={{ color: "var(--wb-content-secondary)" }}
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

/** RadioRow (kit sheet: "RadioRow (checkmark)") — one
 *  option of a single-choice group: label + sub-line, an
 *  accent checkmark when selected. The consumer wraps the
 *  group in role="radiogroup". For a standalone round
 *  radio control outside a row, see Radio in Checkbox.tsx. */
export function RadioRow({ label, sub, selected, onSelect }: RadioRowProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="flex min-h-[47px] w-full cursor-pointer flex-nowrap items-center gap-3 border-0 bg-transparent px-3.5 py-[11px] text-left hover:bg-(--wb-surface-1) focus-visible:outline-2 focus-visible:outline-(--wb-focus-ring)"
    >
      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-[14.5px] font-medium"
          style={{ color: "var(--wb-content-primary)" }}
        >
          {label}
        </span>
        {sub ? (
          <span
            className="block truncate text-[12.5px]"
            style={{ color: "var(--wb-content-secondary)" }}
          >
            {sub}
          </span>
        ) : null}
      </span>
      {selected ? (
        <span className="flex-none" style={{ color: "var(--wb-accent)" }}>
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

/** NoticeRow — the banner as a row above the groups
 *  (kit-first from the scheduler storyboard). Warn is the
 *  standing form; fail is the alert form. */
export function NoticeRow({ title, children, tone = "warn" }: NoticeRowProps) {
  const style: CSSProperties =
    tone === "fail"
      ? {
          backgroundColor:
            "color-mix(in srgb, var(--wb-status-hard-gate) 12%, var(--wb-surface-2))",
          borderColor: "var(--wb-status-hard-gate)",
          borderStyle: "solid",
          borderWidth: 1,
          color: "var(--wb-status-hard-gate-text)",
        }
      : {
          backgroundColor:
            "color-mix(in srgb, var(--wb-okabe-orange) 20%, var(--wb-surface-2))",
          borderColor: "var(--wb-okabe-orange)",
          borderStyle: "solid",
          borderWidth: 1,
          color: "var(--wb-status-stale-text)",
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

/** ActionRow — a full-width action in a group, accent
 *  text, with a danger variant. */
export function ActionRow({ label, danger = false, onClick }: ActionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[47px] w-full cursor-pointer items-center border-0 bg-transparent px-3.5 py-[11px] text-left hover:bg-(--wb-surface-1) focus-visible:outline-2 focus-visible:outline-(--wb-focus-ring)"
    >
      <span
        className="min-w-0 truncate text-[14.5px] font-semibold"
        style={{
          color: danger ? "var(--wb-status-hard-gate-text)" : "var(--wb-accent)",
        }}
      >
        {label}
      </span>
    </button>
  );
}
