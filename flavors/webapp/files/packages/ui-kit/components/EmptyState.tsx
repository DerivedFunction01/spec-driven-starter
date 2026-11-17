// EmptyState — honest empty: a sunken well, one line,
// styled as content. Empty is a state, not an error.
import type { ReactNode } from "react";

export type EmptyStateProps = {
  /** The one line, e.g. "No items match these filters". */
  message: string;
  detail?: string;
  /** A kit Button, if a recovery action exists. At most one. */
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ message, detail, action, className }: EmptyStateProps) {
  return (
    <div
      className={["flex flex-col items-center justify-center gap-2 text-center", className ?? ""]
        .filter(Boolean)
        .join(" ")}
      style={{
        backgroundColor: "var(--ui-surface-sunken)",
        borderColor: "var(--ui-border-default)",
        borderStyle: "dashed",
        borderWidth: 1,
        borderRadius: "var(--ui-radius-lg)",
        padding: "var(--ui-panel-padding)",
      }}
    >
      <p className="text-sm" style={{ color: "var(--ui-content-secondary)" }}>
        {message}
      </p>
      {detail ? (
        <p className="text-xs" style={{ color: "var(--ui-content-muted)" }}>
          {detail}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
