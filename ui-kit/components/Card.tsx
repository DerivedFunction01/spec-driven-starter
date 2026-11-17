// Card — the static content card. No shadow (elevation is
// the surface ladder + border). The ground is surface-2,
// the semantic surface role: the generic component tokens
// carry card padding and radius but no card-specific
// background token, and none is needed — the surface role
// is the priced ground.
import type { ReactNode } from "react";

export type CardProps = {
  title?: ReactNode;
  /** Right end of the title row — kit Buttons only. */
  actions?: ReactNode;
  /** Anchor id — renders `data-anchor` on the root. */
  anchor?: string;
  className?: string;
  children?: ReactNode;
};

export function Card({ title, actions, anchor, className, children }: CardProps) {
  return (
    <section
      data-anchor={anchor}
      className={className}
      style={{
        backgroundColor: "var(--ui-surface-2)",
        borderColor: "var(--ui-border-default)",
        borderStyle: "solid",
        borderWidth: 1,
        borderRadius: "var(--ui-card-radius)",
        padding: "var(--ui-card-padding)",
        color: "var(--ui-content-primary)",
      }}
    >
      {title ? (
        <div className="mb-3 flex items-center justify-between gap-4">
          <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</h3>
          {actions ? <div className="flex min-w-0 items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
