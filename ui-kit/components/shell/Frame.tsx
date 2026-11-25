// Frame — the standard mockup frame (SPEC §9): header, SUNKEN
// preview well holding the mock, optional footer (Chip + Badges
// live there). Archived frames render at 60% saturation with
// their ruled chip intact. Contract: context/component-contracts.md#frame.
import type { ReactNode } from "react";

export type FrameProps = {
  title: string;
  /** e.g. "1440 × 900 · dark" — mono, in the well's corner,
   *  rendered as a small chip on the surface-2 ground so it
   *  reads against any specimen content beneath it (the
   *  bare-text form sat at low contrast over the well —
   *  the workbench critic's finding). */
  viewportLabel?: string;
  headerActions?: ReactNode;
  footer?: ReactNode;
  archived?: boolean;
  /** Anchor id (`<section-or-exhibit>/<component>`, §14) — renders `data-anchor` on the root. */
  anchor?: string;
  className?: string;
  children?: ReactNode;
};

export function Frame({
  title,
  viewportLabel,
  headerActions,
  footer,
  archived = false,
  anchor,
  className,
  children,
}: FrameProps) {
  return (
    <figure
      data-anchor={anchor}
      className={[archived ? "saturate-[0.6]" : "", className ?? ""].filter(Boolean).join(" ")}
      style={{
        backgroundColor: "var(--ui-surface-2)",
        borderColor: "var(--ui-border-default)",
        borderStyle: "solid",
        borderWidth: 1,
        borderRadius: "var(--ui-frame-radius)",
        color: "var(--ui-content-primary)",
        margin: 0,
      }}
    >
      <figcaption className="flex items-center justify-between gap-4 px-4 pt-3 pb-2">
        <span className="truncate text-sm font-semibold">{title}</span>
        {headerActions ? <span className="flex items-center gap-2">{headerActions}</span> : null}
      </figcaption>
      <div
        className="relative mx-4 mb-3"
        style={{ backgroundColor: "var(--ui-surface-sunken)", borderRadius: "var(--ui-radius-md)" }}
      >
        {viewportLabel ? (
          <span
            className="mono pointer-events-none absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs"
            style={{
              color: "var(--ui-content-secondary)",
              backgroundColor: "var(--ui-surface-2)",
              borderColor: "var(--ui-border-default)",
              borderStyle: "solid",
              borderWidth: 1,
            }}
          >
            {viewportLabel}
          </span>
        ) : null}
        <div className="p-4">{children}</div>
      </div>
      {footer ? <div className="flex flex-wrap items-center gap-2 px-4 pb-3">{footer}</div> : null}
    </figure>
  );
}
