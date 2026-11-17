/**
 * The axe leg: axe-core over the surface census, at the
 * contract viewports, in every appearance mode the product
 * carries, WCAG 2.2 AA tag set, with critical and serious
 * violations fatal — zero allowed (docs/checks.md, rendered
 * legs). This is the rendered accessibility verdict the
 * static a11y floor cannot give: it runs over the built,
 * served, rendered page, not over source.
 *
 * DEPENDENCY: @axe-core/playwright and @playwright/test are
 * gate-environment installs (the root package.json carries
 * them as devDependencies); without them this spec fails at
 * import, loudly — the correct shape for a missing guard
 * dependency.
 *
 * The synthetic test below is the leg's proof of function:
 * a page carrying known violations must come back flagged
 * and a clean page empty — an axe leg that has never been
 * seen red is not a guard.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { applyMode, CONTRACT_VIEWPORTS, driveToRoute } from "./qa-fixtures";
import { RENDERED_ROUTES, SURFACE_MODES } from "./surface-routes";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

interface BlockingViolation {
  id: string;
  impact: string;
  help: string;
  nodes: number;
}

type AxeViolations = Awaited<
  ReturnType<InstanceType<typeof AxeBuilder>["analyze"]>
>["violations"];

function toBlocking(violations: AxeViolations): BlockingViolation[] {
  return violations
    .filter((v) => v.impact === "critical" || v.impact === "serious")
    .map((v) => ({ id: v.id, impact: v.impact ?? "", help: v.help, nodes: v.nodes.length }));
}

async function blockingViolations(
  page: Parameters<typeof driveToRoute>[0],
): Promise<BlockingViolation[]> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return toBlocking(results.violations);
}

test.describe("axe leg capability (synthetic)", () => {
  test("a page with known violations is flagged; a clean page is not", async ({ page }) => {
    await page.setContent(`<!doctype html><html><head><title>bad</title></head><body>
      <img src="x.png">
      <button type="button"></button>
      <p style="color:#00b4d8;background:#ffffff">low contrast text</p>
      <input type="text">
    </body></html>`);
    const bad = await blockingViolations(page);
    expect(
      bad.length,
      `synthetic bad page: axe must flag at least one critical/serious violation, got ${JSON.stringify(bad)}`,
    ).toBeGreaterThan(0);
    expect(bad.map((v) => v.id)).toContain("image-alt");

    await page.setContent(`<!doctype html><html lang="en"><head><title>good</title></head><body>
      <main><h1>Clean</h1>
      <img src="x.png" alt="A described image">
      <button type="button">Named button</button>
      <p style="color:#1f2937;background:#ffffff">Readable text</p>
      <label>Your name <input type="text"></label></main>
    </body></html>`);
    const good = await blockingViolations(page);
    expect(good, "synthetic clean page must produce no blocking violations").toEqual([]);
  });
});

for (const mode of SURFACE_MODES) {
  test.describe(`axe over the census (${mode})`, () => {
    for (const route of RENDERED_ROUTES) {
      test(`${route.pattern} [${mode}]`, async ({ page }) => {
        await page.setViewportSize(CONTRACT_VIEWPORTS[0]);
        await applyMode(page, mode);
        await driveToRoute(page, route);
        for (const viewport of CONTRACT_VIEWPORTS) {
          await page.setViewportSize(viewport);
          await page.waitForTimeout(150);
          const violations = await blockingViolations(page);
          expect(
            violations,
            `${route.pattern} [${mode} @${viewport.width}px]: ${violations.length} critical/serious axe violation(s): ${JSON.stringify(violations)}`,
          ).toEqual([]);
        }
      });
    }
  });
}
