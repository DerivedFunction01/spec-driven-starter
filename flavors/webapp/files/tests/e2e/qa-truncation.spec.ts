/**
 * The truncation ruler leg (docs/checks.md, rendered legs):
 * the gate leg for the defect class the geometry sweep is
 * blind to. Ellipsis truncation PREVENTS document overflow,
 * so a geometry-clean page can still carry a value destroyed
 * to "55…" or a label painted over by the control beside it.
 * The ruler (qa-measure.ts, measureTruncation) measures the
 * elements themselves: rendered visible text against full
 * text under ellipsis / clip / line-clamp, and text boxes
 * against the interactive elements that paint over them.
 * This leg is the rendered complement of the composed
 * check's value-slots scanner: the scanner bans the clipping
 * CSS shape in source; this ruler catches the clipping that
 * arrives by layout instead of by declaration.
 *
 * Census discipline: failures are reported PER VIEWPORT
 * CLASS, never pooled — a surface clean at desktop and
 * broken at phone is a phone failure. Classes: phone (390),
 * tablet (768), desktop (1440). A leg whose drive reached no
 * rendered surface (the ruler measured zero text elements)
 * contributes a DRIVE failure line instead of silence — an
 * unmeasured leg is a failure of the census, never a pass.
 * Every leg of a route is measured and collected before the
 * single assertion, so a failing phone leg never leaves the
 * desktop leg unmeasured.
 *
 * Named mid-flow states a URL alone cannot reach (a
 * populated detail view, a mid-checkout page) join this leg
 * as state tests beside the census, driven through the
 * app's own flows in the same per-class form; the seed
 * carries none — the sample app has no such state.
 */
import { expect, type Page, test } from "@playwright/test";
import { CONTRACT_VIEWPORTS, driveToRoute } from "./qa-fixtures";
import { measureTruncation, type TruncationMeasure } from "./qa-measure";
import { RENDERED_ROUTES } from "./surface-routes";

interface Leg {
  label: string;
  size: { width: number; height: number };
}

const CLASSES: { label: string; legs: Leg[] }[] = CONTRACT_VIEWPORTS.map((viewport) => ({
  label: viewport.width === 390 ? "phone" : viewport.width === 768 ? "tablet" : "desktop",
  legs: [{ label: `${viewport.width}`, size: viewport }],
}));

function failureLines(subject: string, classLabel: string, leg: string, m: TruncationMeasure): string[] {
  const out: string[] = [];
  for (const c of m.clipped) {
    const rendered =
      c.visibleText !== "" && c.visibleText !== c.fullText && c.fullText.startsWith(c.visibleText)
        ? `${c.visibleText}…`
        : c.visibleText;
    out.push(
      `${subject} [${classLabel}/${leg}] CLIP ${c.kind} ${c.element} full="${c.fullText}" rendered="${rendered}" scroll=${c.scrollWidth}x${c.scrollHeight} client=${c.clientWidth}x${c.clientHeight}`,
    );
  }
  if (m.clippedTotal > m.clipped.length) {
    out.push(
      `${subject} [${classLabel}/${leg}] CLIP … and ${m.clippedTotal - m.clipped.length} further clipped element(s) past the report cap`,
    );
  }
  for (const o of m.overlaps) {
    out.push(`${subject} [${classLabel}/${leg}] OVERLAP ${o.a} × ${o.b} area=${o.area}px²`);
  }
  if (m.overlapsTotal > m.overlaps.length) {
    out.push(
      `${subject} [${classLabel}/${leg}] OVERLAP … and ${m.overlapsTotal - m.overlaps.length} further overlap pair(s) past the report cap`,
    );
  }
  return out;
}

async function measureLines(
  page: Page,
  subject: string,
  classLabel: string,
  leg: string,
): Promise<string[]> {
  const m = await page.evaluate(measureTruncation);
  if (m.measured === 0) {
    return [
      `${subject} [${classLabel}/${leg}] DRIVE: the ruler measured no text elements — the drive did not reach a rendered surface`,
    ];
  }
  return failureLines(subject, classLabel, leg, m);
}

/** Drive once at the first leg, then resize-and-measure per leg, asserting once at the end. */
async function driveLegs(
  page: Page,
  legs: Leg[],
  drive: () => Promise<void>,
  subject: string,
  classLabel: string,
): Promise<void> {
  const lines: string[] = [];
  let first = true;
  for (const leg of legs) {
    await page.setViewportSize(leg.size);
    if (first) {
      await drive();
      await page.evaluate(() => document.fonts.ready).catch(() => undefined);
      first = false;
    }
    await page.waitForTimeout(150);
    lines.push(...(await measureLines(page, subject, classLabel, leg.label)));
  }
  expect(
    lines,
    `${subject} [${classLabel}]: ${lines.length} truncation failure line(s) across ${legs.length} leg(s)`,
  ).toEqual([]);
}

test.describe("truncation ruler capability (synthetic)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("ellipsis, clamp, vertical clip, and the overlap half are each flagged; a clean page and an sr-only block pass", async ({
    page,
  }) => {
    await page.setContent(`<!doctype html><html><body>
      <div style="width:120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">555 0142 8899 — The Long Household Name</div>
      <div style="display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden; width:120px;">A very long service name that cannot fit on one line</div>
      <div style="height:20px; line-height:20px; overflow:hidden;">First visible line<br>Second line cut away</div>
      <div style="position:relative; height:60px;">
        <span style="position:absolute; left:0; top:0;">A crew line that runs long</span>
        <button type="button" style="position:absolute; left:40px; top:0; width:90px; height:30px;">Assign</button>
      </div>
      <div style="position:absolute; width:1px; height:1px; overflow:hidden; white-space:nowrap;">Screen reader only text that must never be flagged as clipped</div>
      <p style="width:200px;">A wrapping paragraph whose full text renders in full view for everyone reading it.</p>
    </body></html>`);
    const m = await page.evaluate(measureTruncation);
    expect(m.measured, "synthetic: the ruler must see the page's text elements").toBeGreaterThan(0);
    const ellipsis = m.clipped.find((c) => c.kind === "ellipsis");
    expect(ellipsis, "synthetic: the ellipsizing value must be flagged as ellipsis").toBeTruthy();
    expect(ellipsis?.fullText).toContain("Long Household Name");
    expect(
      (ellipsis?.visibleText ?? "").length,
      "synthetic: the rendered text must measure SHORTER than the full text",
    ).toBeLessThan(ellipsis?.fullText.length ?? 0);
    expect(ellipsis?.visibleText).toBe(ellipsis?.fullText.slice(0, ellipsis.visibleText.length));
    expect(
      m.clipped.some((c) => c.kind === "clamp"),
      "synthetic: the line-clamped name must be flagged as clamp",
    ).toBe(true);
    expect(
      m.clipped.some((c) => c.kind === "clip-y"),
      "synthetic: the height-clipped second line must be flagged as clip-y",
    ).toBe(true);
    expect(
      m.clipped.some((c) => c.fullText.includes("Screen reader")),
      "synthetic: the visually-hidden block is out of scope by design and must not be flagged",
    ).toBe(false);
    expect(
      m.clipped.some((c) => c.fullText.includes("wrapping paragraph")),
      "synthetic: the fully-rendered paragraph must not be flagged",
    ).toBe(false);
    expect(
      m.overlaps.some((o) => o.b.includes("Assign")),
      "synthetic: the button painted over the crew line must be flagged as an overlap",
    ).toBe(true);

    await page.setContent(`<!doctype html><html><body>
      <p style="width:240px;">Short values render in full. Nothing is clipped, nothing overlaps.</p>
      <button type="button" style="width:120px; height:48px;">Continue</button>
    </body></html>`);
    const good = await page.evaluate(measureTruncation);
    expect(good.clipped).toEqual([]);
    expect(good.overlaps).toEqual([]);
  });
});

for (const { label, legs } of CLASSES) {
  test.describe(`truncation census — ${label} class`, () => {
    for (const route of RENDERED_ROUTES) {
      test(`truncation census ${route.pattern} (${label})`, async ({ page }) => {
        await driveLegs(page, legs, () => driveToRoute(page, route), route.pattern, label);
      });
    }
  });
}
