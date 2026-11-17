/**
 * The geometry leg: the viewport geometry sweep over the
 * surface census (docs/checks.md, rendered legs). Per route
 * at the contract widths: no horizontal overflow, no
 * interactive element obscured by another, no tap target
 * under the 24x24 floor, and primary targets at the 44x44
 * phone expectation at phone width. The first appearance
 * mode runs every width; each further mode runs a phone-
 * width pass, because mode-specific geometry breaks at the
 * narrowest width first. The ruler lives in qa-measure.ts;
 * the synthetic test below proves the ruler can fail before
 * the census is trusted to it.
 */
import { expect, test } from "@playwright/test";
import { applyMode, CONTRACT_VIEWPORTS, driveToRoute } from "./qa-fixtures";
import { measureGeometry } from "./qa-measure";
import { RENDERED_ROUTES, SURFACE_MODES } from "./surface-routes";

const HEIGHTS: Record<number, number> = Object.fromEntries(
  CONTRACT_VIEWPORTS.map((v) => [v.width, v.height]),
);
const PHONE = CONTRACT_VIEWPORTS[0];

test.describe("geometry ruler capability (synthetic)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("overflow, a sub-floor target, and an overlap are each flagged; a clean page passes", async ({
    page,
  }) => {
    await page.setContent(`<!doctype html><html><body>
      <div style="width:600px;height:10px"></div>
      <button type="button" style="width:12px;height:12px"></button>
      <div style="position:relative;height:60px">
        <button type="button" style="position:absolute;left:0;top:0;width:80px;height:40px">One</button>
        <button type="button" style="position:absolute;left:40px;top:10px;width:80px;height:40px">Two</button>
      </div>
    </body></html>`);
    const bad = await page.evaluate(measureGeometry);
    expect(
      bad.scrollWidth,
      "synthetic: the 600px block must overflow the 390px viewport",
    ).toBeGreaterThan(bad.innerWidth);
    expect(
      bad.smallTargets.length,
      "synthetic: the 12px button must be under the 24px floor",
    ).toBeGreaterThan(0);
    expect(
      bad.overlaps.length,
      "synthetic: the overlapping buttons must be flagged",
    ).toBeGreaterThan(0);

    await page.setContent(`<!doctype html><html><body>
      <button type="button" style="width:120px;height:48px">Fine</button>
      <a href="/x" style="display:inline-block;padding:12px">A link</a>
    </body></html>`);
    const good = await page.evaluate(measureGeometry);
    expect(good.scrollWidth).toBeLessThanOrEqual(good.innerWidth);
    expect(good.smallTargets).toEqual([]);
    expect(good.overlaps).toEqual([]);
  });
});

async function expectCleanGeometry(
  page: Parameters<typeof driveToRoute>[0],
  subject: string,
  width: number,
): Promise<void> {
  await page.setViewportSize({ width, height: HEIGHTS[width] as number });
  await page.waitForTimeout(150);
  const m = await page.evaluate(measureGeometry);
  expect(
    m.scrollWidth,
    `${subject} @${width}px: document scrollWidth ${m.scrollWidth} overflows the ${m.innerWidth}px viewport`,
  ).toBeLessThanOrEqual(m.innerWidth);
  expect(
    m.smallTargets,
    `${subject} @${width}px: ${m.smallTargets.length} target(s) under the 24x24 floor: ${JSON.stringify(m.smallTargets)}`,
  ).toEqual([]);
  expect(
    m.overlaps,
    `${subject} @${width}px: ${m.overlaps.length} obscured interactive pair(s): ${JSON.stringify(m.overlaps)}`,
  ).toEqual([]);
  if (width === PHONE.width) {
    expect(
      m.smallPrimaries,
      `${subject} @${width}px: ${m.smallPrimaries.length} primary target(s) under the 44x44 phone expectation: ${JSON.stringify(m.smallPrimaries)}`,
    ).toEqual([]);
  }
}

for (const route of RENDERED_ROUTES) {
  test(`geometry ${route.pattern} (${SURFACE_MODES[0]}, all widths)`, async ({ page }) => {
    await page.setViewportSize(CONTRACT_VIEWPORTS[2]);
    await applyMode(page, SURFACE_MODES[0]);
    await driveToRoute(page, route);
    for (const viewport of [...CONTRACT_VIEWPORTS].reverse()) {
      await expectCleanGeometry(page, route.pattern, viewport.width);
    }
  });

  for (const mode of SURFACE_MODES.slice(1)) {
    test(`geometry ${route.pattern} (${mode}, phone)`, async ({ page }) => {
      await page.setViewportSize(PHONE);
      await applyMode(page, mode);
      await driveToRoute(page, route);
      await expectCleanGeometry(page, `${route.pattern} [${mode}]`, PHONE.width);
    });
  }
}
