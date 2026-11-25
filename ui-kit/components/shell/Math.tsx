// Math — the kit's typeset-math component (the math-
// component study, owner-approved; its forms are the
// study's frames, reproduced exactly). It renders ONE
// served math node: the backend serves structured segments
// — text runs plus math nodes carrying {source, display,
// valid} — and this component typesets the node with
// KaTeX 0.16.11.
//
// Validity is a SERVED state, not a render outcome. A node
// with valid === false renders the study's frame-5
// fallback from its source (inline: the raw source in a
// mono chip on sunken, hard-gate text colour; display: the
// raw source as a mono block on sunken with the vermilion
// left bar), and valid neighbours are unaffected. KaTeX is
// called with throwOnError: false only as a render guard —
// a node wrongly served as valid degrades to KaTeX's own
// error rendering instead of throwing through the page;
// the fallback decision is never made here.
//
// The display form is the study's sunken well, and its
// overflow rule is the owner's pick (frame
// 4a): the equation rides a max-content span inside the
// scrolling well, so a wide equation scrolls horizontally
// AT FULL TYPESET SIZE. Frame 4b (shrink-to-fit) was
// rejected and does not exist in this component.
//
// Equation numbers are document content: the number node
// the document serves ("(1)") arrives as this component's
// children and renders in the well's floated slot, exactly
// as frame 1 draws it. The component never generates or
// counts numbers.
//
// Accessibility: each typeset node carries its TeX source
// as its accessible name (role="math", aria-label), and
// KaTeX's MathML output stays enabled (the default
// htmlAndMathml output is never narrowed).
//
// KaTeX's own assets are vendored in the kit (assets/
// katex-fonts.css, katex.css, katex-sizing.css and
// katex-symbols.css, woff2-only, and its fonts
// in assets/fonts/katex/)
// and imported HERE, by the component — never through
// themes/index.css and never from a CDN. That is the
// K2 lesson applied in advance: the stylesheet reference
// resolves inside the kit, so no consumer stubs a file
// or skips an import for this component.
import { type ReactNode, useMemo } from "react";
import katex from "katex";
import "../../assets/katex-fonts.css";
import "../../assets/katex.css";
import "../../assets/katex-sizing.css";
import "../../assets/katex-symbols.css";
import "../../assets/math.css";

export type MathProps = {
  /** The node's TeX source, as served. Also the node's
   *  accessible name, and — for an invalid node — the
   *  fallback's rendered text. */
  source: string;
  /** Display form (the sunken well). Absent ⇒ inline,
   *  set in the prose around it. */
  display?: boolean;
  /** The served validity state. Absent ⇒ valid. False ⇒
   *  the frame-5 malformed fallback renders. */
  valid?: boolean;
  /** Display form only: the equation number, document
   *  content served with the node (e.g. "(1)"), drawn in
   *  the well's floated slot. Not rendered for inline or
   *  invalid nodes — frame 5's block carries no number. */
  children?: ReactNode;
  className?: string;
};

export function Math({ source, display = false, valid = true, children, className }: MathProps) {
  const html = useMemo(
    () =>
      valid
        ? katex.renderToString(source, {
            displayMode: display,
            throwOnError: false,
            strict: false,
          })
        : null,
    [source, display, valid],
  );

  if (!valid) {
    return display ? (
      <div className={["ui-math-broken-block", className ?? ""].filter(Boolean).join(" ")}>
        {source}
      </div>
    ) : (
      <span className={["ui-math-broken", className ?? ""].filter(Boolean).join(" ")}>
        {source}
      </span>
    );
  }

  if (display) {
    return (
      <div className={["ui-math-display", className ?? ""].filter(Boolean).join(" ")}>
        {children != null ? <span className="ui-math-eqno">{children}</span> : null}
        <span
          className="ui-math-scroll-inner"
          role="math"
          aria-label={source}
          dangerouslySetInnerHTML={{ __html: html ?? "" }}
        />
      </div>
    );
  }

  return (
    <span
      className={["ui-math-inline", className ?? ""].filter(Boolean).join(" ")}
      role="math"
      aria-label={source}
      dangerouslySetInnerHTML={{ __html: html ?? "" }}
    />
  );
}
