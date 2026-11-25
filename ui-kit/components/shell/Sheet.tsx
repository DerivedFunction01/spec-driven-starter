// Sheet — modal panel / confirm sheet (the approve confirm is
// the canonical use). Escape (document listener) + backdrop
// button close; focus moves to the panel on open; the visible
// title is the accessible name.
// Panel contract (mobile critic, K2): the panel's
// width is net of its own margins (100% − 1rem against the
// m-2), so its margin box never overflows the root — the
// w-full + m-2 form rendered at x=−8 on phone. The content
// region scrolls (overflow-y-auto over the min-h-0 bound):
// a form taller than the panel scrolls inside it instead of
// painting over the footer. The footer wraps, and its
// children hold their natural width, so a crowded action
// row wraps to a second line instead of ellipsizing its
// labels to stubs.
// Contract: context/component-contracts.md#sheet.
import { type ReactNode, useEffect, useRef } from "react";

export type SheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Anchor id (`<section-or-exhibit>/<component>`, §14) — renders `data-anchor` on the root. */
  anchor?: string;
  className?: string;
  children?: ReactNode;
  footer?: ReactNode;
};

export function Sheet({ open, title, onClose, anchor, className, children, footer }: SheetProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div data-anchor={anchor} className="fixed inset-0 z-50 flex items-stretch justify-end">
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{
          backgroundColor: "color-mix(in srgb, var(--ui-content-primary) 45%, transparent)",
          transitionDuration: "var(--ui-motion-duration-sheet)",
          transitionTimingFunction: "var(--ui-motion-ease)",
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={[
          "relative m-2 flex w-[calc(100%-1rem)] max-w-[480px] flex-col focus-visible:outline-none",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          backgroundColor: "var(--ui-surface-3)",
          borderColor: "var(--ui-border-default)",
          borderStyle: "solid",
          borderWidth: 1,
          borderRadius: "var(--ui-panel-radius)",
          boxShadow: "var(--ui-shadow-overlay)",
          padding: "var(--ui-panel-padding)",
          color: "var(--ui-content-primary)",
        }}
      >
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer ? (
          <div className="mt-6 flex flex-wrap justify-end gap-2 [&>*]:shrink-0">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
