/**
 * The dead-click sweep (docs/checks.md, rendered legs): the
 * mechanical sweep over NAVIGATION CHROME — the landmarks
 * each census route declares in surface-routes.ts. A visible
 * signifier is not proof of a handler; a dead click is
 * confirmed only by clicking, and the engine (qa-sweep.ts)
 * counts a click only on an observable effect. Form submits
 * and mutating controls are excluded by the engine's
 * recorded safety rules — they belong to their own surfaces'
 * specs. This sweep is the rendered complement of the
 * misclick audit in docs/checks.md: the audit inventories
 * and classifies committing controls; the sweep proves the
 * chrome's controls answer.
 *
 * The synthetic test below is the sweep's proof of function,
 * including its identity pin: hidden twins of the live
 * controls are planted so a sweep that re-finds controls by
 * collection position clicks the hidden twin and reports the
 * LIVE control dead — identity-based re-finding (name + href
 * + ordinal) is what the arrangement proves.
 */
import { expect, test } from "@playwright/test";
import { driveToRoute } from "./qa-fixtures";
import { expectNoDeadClicks, sweepLandmark } from "./qa-sweep";
import { RENDERED_ROUTES } from "./surface-routes";

test.describe("dead-click sweep capability (synthetic)", () => {
  test("a dead button and a dead link are flagged; live controls pass", async ({ page }) => {
    const synthetic = `<!doctype html><html><body>
      <nav>
        <a href="#target" style="display:none">Hash link</a>
        <a href="#target">Hash link</a>
        <button type="button" aria-pressed="false"
          onclick="this.setAttribute('aria-pressed', this.getAttribute('aria-pressed') !== 'true')">Toggle</button>
        <button type="button" style="display:none">Dead button</button>
        <button type="button">Dead button</button>
        <a href="#" onclick="return false">Dead link</a>
      </nav>
      <div id="target">target</div>
    </body></html>`;
    await page.setContent(synthetic);
    const verdicts = await sweepLandmark(page, "nav", async () => {
      await page.setContent(synthetic);
    });
    const byName = new Map(verdicts.map((v) => [v.name, v.outcome]));
    expect(byName.get("Hash link"), "the hash link must show an effect").toBe("effect");
    expect(byName.get("Toggle"), "the toggle must show an effect").toBe("effect");
    expect(byName.get("Dead button"), "the dead button must be caught").toBe("dead");
    expect(byName.get("Dead link"), "the dead link must be caught").toBe("dead");
  });
});

for (const route of RENDERED_ROUTES) {
  for (const landmark of route.landmarks ?? []) {
    test(`dead-click ${route.pattern} landmark ${landmark}`, async ({ page }) => {
      await driveToRoute(page, route);
      const verdicts = await sweepLandmark(page, landmark, async () => {
        await driveToRoute(page, route);
      });
      expectNoDeadClicks(`${route.pattern} ${landmark}`, verdicts);
    });
  }
}
