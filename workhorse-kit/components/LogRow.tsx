// LogRow — the ONE timeline / log-entry row for every app
// (kit sheet: "the mono event-stream row"), redesigned once
// in the timeline-component study (2026-11-13, Variant B as
// picked by the owner) instead of being reinvented per app.
//
// Anatomy (Variant B): row 1 is [date token · headline …
// kind badge (right, where a kind is served) · chevron];
// row 2 is [time · meta],
// indented to the headline's edge. The date token rides a
// fixed 48px column, so the headline starts at the same
// offset on every row however wide the kind word runs —
// Run beside Catchup beside Fulfilled. The kind badge is
// flex 0 0 auto and paid for first: it can never clip (the
// defect this redesign answers — badges cut mid-word in a
// fixed time column). The headline is the only flexible
// element; it wraps, and truncates only under genuine
// pressure. Time left the fixed column and rides row 2,
// leading, in mono.
//
// Form discipline (the standing log-UI rule): this is a
// pure form-model. The component renders ONE served entry
// shape and contains no per-app knowledge — kinds, tones,
// facts, and the entity arrive as data. The headline is
// body text; mono appears only in the date token, the
// meta line's time, and mono-flagged drawer facts.
//
// A row carries headline + one meta line; everything else
// lives in the drawer (LogRowDrawer, same file): the full
// un-truncated message, the served facts, and an optional
// entity routing row. Nothing beyond the two lines is ever
// squeezed into the row to make room for them.
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";

export type LogRowTone = "ok" | "info" | "warn" | "fail" | "idle";

export interface LogRowKind {
  label: string;
  tone: LogRowTone;
}

export interface LogRowFact {
  label: string;
  value: string;
  /** Mono value (timestamps, hashes, deltas). */
  mono?: boolean;
}

export interface LogRowEntity {
  /** The drawer's group label over the routing row ("Session"). */
  groupLabel: string;
  title: string;
  sub?: string;
}

export interface LogRowDetail {
  /** The full message, un-truncated. */
  message: string;
  facts: LogRowFact[];
  /** Group label over the facts; defaults to "Details". */
  factsLabel?: string;
  entity?: LogRowEntity;
}

export interface LogRowEntry {
  /** Compact served date token ("Nov 13"); rides the fixed column. */
  dateToken: string;
  /** Served time ("2:02 PM"); leads the meta line, mono. */
  time: string;
  headline: string;
  /** The kind chip — present only where the record serves one.
   *  Absent ⇒ no badge renders, in the row or the drawer
   *  (honest absence: the scoped variant the timeline study
   *  ruled — never invent a badge the record does not serve). */
  kind?: LogRowKind;
  /** Row 2 summary / actor, after the time. Absent ⇒ time alone. */
  meta?: string;
  /** Present ⇒ the row opens the drawer (and wears a chevron). */
  detail?: LogRowDetail;
}

/** The mockup's chevron (8×13, 2px round-cap stroke) —
 *  inline SVG so the kit stays dependency-free. */
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
    >
      <path d="M1.5 1.5 6.5 6.5 1.5 11.5" />
    </svg>
  );
}

const TONE_HUE: Record<Exclude<LogRowTone, "idle">, string> = {
  ok: "var(--wb-okabe-bluish-green)",
  info: "var(--wb-okabe-blue)",
  warn: "var(--wb-okabe-orange)",
  fail: "var(--wb-okabe-vermilion)",
};

/** The kind badge: filled pill, dot + word, flex-none — the
 *  element that is paid for first and never clips. */
function KindBadge({ kind }: { kind: LogRowKind }) {
  if (kind.tone === "idle") {
    return (
      <span
        className="inline-flex max-w-full items-center gap-1.5 whitespace-nowrap"
        style={{
          backgroundColor: "var(--wb-surface-sunken)",
          color: "var(--wb-content-secondary)",
          borderRadius: 999,
          padding: "2.5px 9px",
          fontSize: 12,
          fontWeight: 650,
        }}
      >
        <span
          aria-hidden="true"
          className="inline-block shrink-0 rounded-full"
          style={{ width: 7, height: 7, backgroundColor: "var(--wb-content-muted)" }}
        />
        {kind.label}
      </span>
    );
  }
  const hue = TONE_HUE[kind.tone];
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 whitespace-nowrap"
      style={{
        backgroundColor: `color-mix(in srgb, ${hue} 16%, transparent)`,
        color: `color-mix(in srgb, ${hue} 78%, var(--wb-content-primary))`,
        borderRadius: 999,
        padding: "2.5px 9px",
        fontSize: 12,
        fontWeight: 650,
      }}
    >
      <span
        aria-hidden="true"
        className="inline-block shrink-0 rounded-full"
        style={{ width: 7, height: 7, backgroundColor: hue }}
      />
      {kind.label}
    </span>
  );
}

export type LogRowProps = {
  entry: LogRowEntry;
  /** Present (with entry.detail) ⇒ the row is a button that opens the drawer. */
  onOpen?: () => void;
  className?: string;
};

export function LogRow({ entry, onOpen, className }: LogRowProps) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const interactive = Boolean(entry.detail && onOpen);
  const style: CSSProperties = {
    backgroundColor: interactive
      ? active
        ? "var(--wb-surface-sunken)"
        : hover
          ? "var(--wb-surface-1)"
          : "transparent"
      : "transparent",
    color: "var(--wb-content-primary)",
    padding: "10px 14px",
    textAlign: "left",
    width: "100%",
  };
  const inner = (
    <>
      <span className="flex items-start gap-2">
        <span
          className="mono whitespace-nowrap"
          style={{
            flex: "0 0 48px",
            marginTop: 2,
            fontSize: 12.5,
            color: "var(--wb-content-secondary)",
          }}
        >
          {entry.dateToken}
        </span>
        <span
          className="min-w-0 flex-1 [overflow-wrap:anywhere]"
          style={{ fontSize: 14, fontWeight: 550, lineHeight: 1.38 }}
        >
          {entry.headline}
        </span>
        {entry.kind ? (
          <span style={{ flex: "0 0 auto", marginTop: 1 }}>
            <KindBadge kind={entry.kind} />
          </span>
        ) : null}
        {interactive ? (
          <span
            className="shrink-0"
            style={{ color: "var(--wb-content-muted)", marginTop: 3, lineHeight: 1 }}
          >
            <Chevron />
          </span>
        ) : null}
      </span>
      <span
        className="block [overflow-wrap:anywhere]"
        style={{
          marginLeft: 56,
          marginTop: 2,
          fontSize: 12.5,
          lineHeight: 1.4,
          color: "var(--wb-content-secondary)",
        }}
      >
        <span className="mono">{entry.time}</span>
        {entry.meta ? <> · {entry.meta}</> : null}
      </span>
    </>
  );
  const classes = ["block", className ?? ""].filter(Boolean).join(" ");
  if (!interactive) {
    return (
      <div className={classes} style={style}>
        {inner}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setActive(false);
      }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      className={`${classes} cursor-pointer focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-1 focus-visible:outline-(--wb-focus-ring)`}
      style={style}
    >
      {inner}
    </button>
  );
}

/* ---------------- the drawer ---------------- */

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: "var(--wb-content-secondary)",
        margin: "20px 0 8px 2px",
      }}
    >
      {children}
    </div>
  );
}

const factGroupStyle: CSSProperties = {
  backgroundColor: "var(--wb-surface-2)",
  borderColor: "var(--wb-border-default)",
  borderStyle: "solid",
  borderWidth: 1,
  borderRadius: "var(--wb-radius-md)",
  overflow: "hidden",
};

export type LogRowDrawerProps = {
  /** The opened entry; null (or an entry without detail) renders nothing. */
  entry: LogRowEntry | null;
  onClose: () => void;
  /** Present (with entry.detail.entity) ⇒ the entity row routes. */
  onEntityOpen?: () => void;
  /** Consumer chrome rendered at the entity row's left (e.g. an app tile). */
  entityLeading?: ReactNode;
};

/** LogRowDrawer — the entry's bottom drawer. Its header
 *  follows the row's own rule: date · time lead (mono), and
 *  the kind badge takes the right end where one is served.
 *  Below it: the full
 *  message, the facts as a grouped list, and the optional
 *  entity routing row under its served group label.
 *  Escape and the backdrop close it; focus moves to the
 *  panel on open (the kit Sheet's discipline). */
export function LogRowDrawer({ entry, onClose, onEntityOpen, entityLeading }: LogRowDrawerProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const detail = entry?.detail;

  useEffect(() => {
    if (!entry || !detail) return;
    panelRef.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [entry, detail, onClose]);

  if (!entry || !detail) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{
          backgroundColor: "color-mix(in srgb, var(--wb-content-primary) 45%, transparent)",
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={entry.headline}
        tabIndex={-1}
        className="relative focus-visible:outline-none"
        style={{
          backgroundColor: "var(--wb-surface-2)",
          borderRadius: "var(--wb-panel-radius) var(--wb-panel-radius) 0 0",
          boxShadow: "var(--wb-shadow-overlay)",
          padding: "6px 18px 20px",
          color: "var(--wb-content-primary)",
          maxHeight: "82vh",
          overflowY: "auto",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 36,
            height: 5,
            borderRadius: 3,
            backgroundColor: "var(--wb-border-strong)",
            margin: "8px auto 14px",
          }}
        />
        <div className="flex items-center gap-2">
          <span className="mono" style={{ fontSize: 13.5, color: "var(--wb-content-secondary)" }}>
            {entry.dateToken} · {entry.time}
          </span>
          {entry.kind ? (
            <span style={{ marginLeft: "auto", flex: "0 0 auto" }}>
              <KindBadge kind={entry.kind} />
            </span>
          ) : null}
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.45, margin: "10px 0 4px" }}>
          {detail.message}
        </p>
        <GroupLabel>{detail.factsLabel ?? "Details"}</GroupLabel>
        <div style={factGroupStyle}>
          {detail.facts.map((fact, i) => (
            <div
              key={fact.label}
              className="flex items-center gap-3"
              style={{
                padding: "11px 14px",
                minHeight: 47,
                borderTop: i > 0 ? "1px solid var(--wb-border-default)" : undefined,
              }}
            >
              <span style={{ fontSize: 14.5, fontWeight: 550 }}>{fact.label}</span>
              <span
                className={fact.mono ? "mono" : undefined}
                style={{
                  marginLeft: "auto",
                  fontSize: 14,
                  color: "var(--wb-content-secondary)",
                  whiteSpace: "nowrap",
                }}
              >
                {fact.value}
              </span>
            </div>
          ))}
        </div>
        {detail.entity ? (
          <>
            <GroupLabel>{detail.entity.groupLabel}</GroupLabel>
            <div style={factGroupStyle}>
              <button
                type="button"
                onClick={onEntityOpen}
                className="flex w-full cursor-pointer items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-1 focus-visible:outline-(--wb-focus-ring)"
                style={{
                  padding: "11px 14px",
                  minHeight: 47,
                  color: "var(--wb-content-primary)",
                  backgroundColor: "transparent",
                }}
              >
                {entityLeading}
                <span className="min-w-0 flex-1">
                  <span className="block" style={{ fontSize: 14.5, fontWeight: 550 }}>
                    {detail.entity.title}
                  </span>
                  {detail.entity.sub ? (
                    <span
                      className="block"
                      style={{ fontSize: 12.5, color: "var(--wb-content-secondary)" }}
                    >
                      {detail.entity.sub}
                    </span>
                  ) : null}
                </span>
                <span
                  className="shrink-0"
                  style={{ color: "var(--wb-content-muted)", lineHeight: 1 }}
                >
                  <Chevron />
                </span>
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
