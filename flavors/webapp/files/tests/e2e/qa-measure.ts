/**
 * The rendered rulers: pure in-page measurement functions
 * the geometry and truncation legs evaluate against the
 * live DOM. Each exported function is SELF-CONTAINED —
 * Playwright serializes its source into the page, so every
 * constant and helper it uses is declared inside it; a
 * ruler that reaches for module scope throws in the page
 * instead of measuring. Each names what it measured and
 * reports counts alongside capped lists: a ruler that
 * reports a verdict without its measurements cannot be
 * argued with, and a leg whose ruler measured nothing has
 * not run. The bars live in the specs; this file measures.
 */

export interface SmallTarget {
  element: string;
  width: number;
  height: number;
}

export interface OverlapPair {
  a: string;
  b: string;
  area: number;
}

export interface GeometryMeasure {
  innerWidth: number;
  scrollWidth: number;
  interactiveCount: number;
  smallTargets: SmallTarget[];
  smallPrimaries: SmallTarget[];
  overlaps: OverlapPair[];
}

export interface TruncationClip {
  kind: "ellipsis" | "clamp" | "clip-x" | "clip-y";
  element: string;
  fullText: string;
  visibleText: string;
  scrollWidth: number;
  scrollHeight: number;
  clientWidth: number;
  clientHeight: number;
}

export interface TruncationMeasure {
  measured: number;
  clipped: TruncationClip[];
  clippedTotal: number;
  overlaps: OverlapPair[];
  overlapsTotal: number;
}

export function measureGeometry(): GeometryMeasure {
  const INTERACTIVE =
    "a[href], button, input, select, textarea, summary, [role='button'], [role='link']";
  const FLOOR = 24;
  const PRIMARY_FLOOR = 44;
  const CAP = 12;

  const describe = (el: Element): string => {
    const text = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
    const label = el.getAttribute("aria-label") ?? text;
    return `${el.tagName.toLowerCase()} "${label}"`;
  };
  const visible = (el: Element): boolean => {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };
  // A checkbox or radio is operated through its label where
  // it has one: the label's box is the target the user hits.
  const targetBox = (el: Element): DOMRect => {
    const rect = el.getBoundingClientRect();
    if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
      const label = el.closest("label");
      if (label) {
        const labelRect = label.getBoundingClientRect();
        if (labelRect.width >= rect.width && labelRect.height >= rect.height) return labelRect;
      }
    }
    return rect;
  };
  // Links inside a line of prose are exempt from the target
  // floor (the WCAG inline-link exception): their box is the
  // line's, and flooring them would flag every paragraph.
  const isInlineTextLink = (el: Element): boolean => {
    if (el.tagName !== "A") return false;
    const parent = el.parentElement;
    if (!parent || !/^(P|LI|TD|DD|SPAN)$/.test(parent.tagName)) return false;
    const rect = el.getBoundingClientRect();
    const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight);
    return Number.isFinite(lineHeight) && rect.height <= lineHeight * 1.6;
  };
  const isPrimary = (el: Element): boolean => {
    if (el.hasAttribute("data-primary")) return true;
    if (el instanceof HTMLButtonElement && el.type === "submit") {
      // Row actions inside tables are not page primaries.
      return el.closest("td") === null;
    }
    return el instanceof HTMLInputElement && el.type === "submit";
  };

  const elements = Array.from(document.querySelectorAll(INTERACTIVE)).filter(
    (el) => visible(el) && !(el as HTMLButtonElement).disabled,
  );
  const smallTargets: SmallTarget[] = [];
  const smallPrimaries: SmallTarget[] = [];
  for (const el of elements) {
    const box = targetBox(el);
    if ((box.width < FLOOR - 0.5 || box.height < FLOOR - 0.5) && !isInlineTextLink(el)) {
      smallTargets.push({
        element: describe(el),
        width: Math.round(box.width),
        height: Math.round(box.height),
      });
    }
    if (isPrimary(el) && (box.width < PRIMARY_FLOOR - 0.5 || box.height < PRIMARY_FLOOR - 0.5)) {
      smallPrimaries.push({
        element: describe(el),
        width: Math.round(box.width),
        height: Math.round(box.height),
      });
    }
  }
  const overlaps: OverlapPair[] = [];
  const boxes = elements
    .slice(0, 400)
    .map((el) => ({ el, rect: el.getBoundingClientRect() }));
  for (let i = 0; i < boxes.length && overlaps.length < CAP; i += 1) {
    for (let j = i + 1; j < boxes.length && overlaps.length < CAP; j += 1) {
      const a = boxes[i];
      const b = boxes[j];
      if (!a || !b) continue;
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const x = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
      const y = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
      if (x > 3 && y > 3) {
        overlaps.push({ a: describe(a.el), b: describe(b.el), area: Math.round(x * y) });
      }
    }
  }
  return {
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    interactiveCount: elements.length,
    smallTargets: smallTargets.slice(0, CAP),
    smallPrimaries: smallPrimaries.slice(0, CAP),
    overlaps,
  };
}

export function measureTruncation(): TruncationMeasure {
  const INTERACTIVE =
    "a[href], button, input, select, textarea, summary, [role='button'], [role='link']";
  const CAP = 20;

  const describe = (el: Element): string => {
    const text = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
    const label = el.getAttribute("aria-label") ?? text;
    return `${el.tagName.toLowerCase()} "${label}"`;
  };
  const visible = (el: Element): boolean => {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    return el.getClientRects().length > 0;
  };
  // The visually-hidden pattern (screen-reader-only text)
  // clips by design and is out of scope.
  const visuallyHidden = (el: Element, style: CSSStyleDeclaration): boolean => {
    const rect = el.getBoundingClientRect();
    return (
      rect.width <= 1 &&
      rect.height <= 1 &&
      (style.overflow === "hidden" || style.clip !== "auto" || style.position === "absolute")
    );
  };
  // The longest prefix of the element's first text node
  // whose rendered range fits the element's client box —
  // the visible text, measured rather than guessed.
  const visiblePrefix = (el: Element): string => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node && (node.textContent ?? "").trim() === "") {
      node = walker.nextNode();
    }
    if (!node || !node.textContent) return "";
    const text = node.textContent;
    const range = document.createRange();
    const box = el.getBoundingClientRect();
    const fits = (end: number): boolean => {
      range.setStart(node as Node, 0);
      range.setEnd(node as Node, end);
      const rect = range.getBoundingClientRect();
      return rect.width <= box.width + 1 && rect.height <= box.height + 1;
    };
    if (fits(text.length)) return text;
    let lo = 0;
    let hi = text.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (fits(mid)) lo = mid;
      else hi = mid - 1;
    }
    return text.slice(0, lo).trimEnd();
  };

  const interactives: { el: Element; rect: DOMRect }[] = [];
  for (const el of Array.from(document.querySelectorAll(INTERACTIVE))) {
    if (visible(el)) interactives.push({ el, rect: el.getBoundingClientRect() });
  }
  const clipped: TruncationClip[] = [];
  let clippedTotal = 0;
  let measured = 0;
  const textBoxes: { el: Element; rect: DOMRect }[] = [];
  for (const el of Array.from(document.querySelectorAll("body *"))) {
    const fullText = (el.textContent ?? "").trim().replace(/\s+/g, " ");
    if (!fullText) continue;
    // Text-bearing means the element's own nodes carry the
    // text; containers would re-report their descendants.
    const ownText = Array.from(el.childNodes).some(
      (child) => child.nodeType === Node.TEXT_NODE && (child.textContent ?? "").trim() !== "",
    );
    if (!ownText || !visible(el)) continue;
    const style = getComputedStyle(el);
    if (visuallyHidden(el, style)) continue;
    measured += 1;
    textBoxes.push({ el, rect: el.getBoundingClientRect() });
    const overX = el.scrollWidth > el.clientWidth + 1;
    const overY = el.scrollHeight > el.clientHeight + 1;
    if (!overX && !overY) continue;
    let kind: TruncationClip["kind"] | null = null;
    if (style.textOverflow === "ellipsis" && overX) kind = "ellipsis";
    else if (style.webkitLineClamp !== "none" && style.webkitLineClamp !== "" && overY) {
      kind = "clamp";
    } else if (style.overflowX === "hidden" && overX) kind = "clip-x";
    else if (style.overflowY === "hidden" && overY) kind = "clip-y";
    if (!kind) continue;
    clippedTotal += 1;
    if (clipped.length < CAP) {
      clipped.push({
        kind,
        element: describe(el),
        fullText,
        visibleText: visiblePrefix(el),
        scrollWidth: el.scrollWidth,
        scrollHeight: el.scrollHeight,
        clientWidth: el.clientWidth,
        clientHeight: el.clientHeight,
      });
    }
  }
  // The overlap half: a value no one can read because an
  // interactive element paints over it is clipped in effect
  // even when its own box is honest.
  const overlaps: OverlapPair[] = [];
  let overlapsTotal = 0;
  for (const text of textBoxes) {
    for (const other of interactives) {
      if (text.el === other.el || text.el.contains(other.el) || other.el.contains(text.el)) {
        continue;
      }
      const x =
        Math.min(text.rect.right, other.rect.right) - Math.max(text.rect.left, other.rect.left);
      const y =
        Math.min(text.rect.bottom, other.rect.bottom) - Math.max(text.rect.top, other.rect.top);
      if (x > 3 && y > 3) {
        overlapsTotal += 1;
        if (overlaps.length < CAP) {
          overlaps.push({
            a: describe(text.el),
            b: describe(other.el),
            area: Math.round(x * y),
          });
        }
      }
    }
  }
  return { measured, clipped, clippedTotal, overlaps, overlapsTotal };
}
