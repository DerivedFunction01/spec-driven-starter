// SectionBoundary — the shell's structural backstop: a
// React error boundary around the routed section content
// (wired in App, one per presentation, keyed by route so
// navigating away clears a stuck fallback). A render
// exception inside any section is contained here: the
// fallback renders in the section's place while the shell
// around it — top bar, tab bar, rail — stays mounted and
// usable. Without it, one throwing section unmounts the
// whole React root and blanks the viewer, chrome included
// (the failure shape the tap-blank diagnosis ruled out for
// that defect but which no section bug should ever be
// able to produce). The fallback names the error so the
// failure is reportable, never silent.

import { Component, type ReactNode } from "react";

interface SectionBoundaryState {
  error: Error | null;
}

export class SectionBoundary extends Component<{ children: ReactNode }, SectionBoundaryState> {
  override state: SectionBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): SectionBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error): void {
    // The fallback carries the message on screen; the
    // console copy keeps the stack for diagnosis.
    console.error("Section render failed:", error);
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (error === null) return this.props.children;
    return (
      <section
        data-anchor="section/error"
        role="alert"
        style={{
          background: "var(--ui-surface-1)",
          border: "1px solid var(--ui-border-default)",
          borderRadius: "var(--ui-radius-md)",
          padding: "var(--ui-space-16)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--ui-space-8)",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "var(--ui-font-size-base)",
            lineHeight: "var(--ui-line-height-base)",
            fontWeight: 700,
          }}
        >
          This section hit an error
        </h2>
        <p
          className="mono"
          style={{
            margin: 0,
            fontSize: "var(--ui-font-size-sm)",
            lineHeight: "var(--ui-line-height-sm)",
            color: "var(--ui-content-secondary)",
            overflowWrap: "anywhere",
          }}
        >
          {error.message}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "var(--ui-font-size-sm)",
            lineHeight: "var(--ui-line-height-sm)",
            color: "var(--ui-content-secondary)",
          }}
        >
          The rest of the viewer is unaffected — pick another section or tab to keep going.
        </p>
      </section>
    );
  }
}
