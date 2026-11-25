// DegradedBanner — per-project degraded state + plan
// source-format flags. An error names the section + the
// recovery in one sentence, once. Never danger tokens.
// Contract: context/component-contracts.md#degradedbanner.
export type DegradedBannerProps = {
  tone?: "degraded" | "source-format";
  /** Section + problem, one sentence. */
  message: string;
  /** The recovery, one sentence. */
  detail?: string;
  className?: string;
};

export function DegradedBanner({
  tone = "degraded",
  message,
  detail,
  className,
}: DegradedBannerProps) {
  const degraded = tone === "degraded";
  return (
    <div
      role="status"
      className={["flex items-start gap-2 px-4 py-3", className ?? ""].filter(Boolean).join(" ")}
      style={
        degraded
          ? {
              backgroundColor: "color-mix(in srgb, var(--ui-status-stale) 14%, transparent)",
              borderColor: "var(--ui-status-stale)",
              borderStyle: "solid",
              borderWidth: 1,
              borderRadius: "var(--ui-radius-md)",
              color: "var(--ui-content-primary)",
            }
          : {
              backgroundColor: "var(--ui-surface-1)",
              borderColor: "var(--ui-border-default)",
              borderStyle: "solid",
              borderWidth: 1,
              borderRadius: "var(--ui-radius-md)",
              color: "var(--ui-content-primary)",
            }
      }
    >
      <span
        aria-hidden="true"
        className="shrink-0 text-sm leading-none"
        style={{ color: degraded ? "var(--ui-status-stale)" : "var(--ui-content-secondary)" }}
      >
        {degraded ? "⚠" : "ℹ"}
      </span>
      <div className="min-w-0 flex-1 text-sm [overflow-wrap:anywhere]">
        <p>{message}</p>
        {detail ? <p style={{ color: "var(--ui-content-secondary)" }}>{detail}</p> : null}
      </div>
    </div>
  );
}
