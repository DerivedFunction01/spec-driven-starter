/**
 * The parity leg: the built app, on the suite's seeded
 * server, captured per manifest view and pixel-diffed
 * against the approved design reference (parity-views.ts).
 * Regression tooling answers "did it change against the
 * build's own baseline?"; this leg answers "does it match
 * what was approved?" — references are approved artefacts,
 * never captures of the current build, and never auto-
 * updated.
 *
 * Tolerance discipline (full text: parity-views.ts and
 * docs/checks.md, rendered legs): per-pixel threshold
 * 16/255 on any RGB channel; a view passes at or under its
 * mismatch ratio (the default below, or its manifest
 * override); masked regions are manifest data with reasons.
 *
 * Modes:
 * - Asserted (default): views marked `asserted` must pass
 *   or the test fails. `pending` views are skipped BY NAME
 *   with their owning work — enumerated, never silent.
 * - Audit (PARITY_AUDIT=1): every view is captured and
 *   diffed, nothing fails on ratio, and a per-view mismatch
 *   table is printed. A view is proven in audit mode before
 *   its manifest status flips to `asserted`.
 *
 * Capture discipline: before every capture the spec scrolls
 * stepwise through the full page and back to the top, then
 * waits until every <img> reports complete with a natural
 * size. Lazy images paint only once scrolled into view;
 * capturing without the scroll/wait records blank image
 * boxes and manufactures mismatch that is not an app defect.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { decodePng, diffPng } from "./parity-diff";
import { PARITY_VIEWS, type ParityView } from "./parity-views";

const PER_PIXEL_THRESHOLD = 16;
const DEFAULT_MAX_MISMATCH_RATIO = 0.02;
const AUDIT = process.env.PARITY_AUDIT === "1";
const REFERENCE_DIR = join(process.cwd(), "tests", "e2e", "parity", "reference");
const IMAGE_WAIT_TIMEOUT_MS = 15_000;

async function prepareCapture(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight / 2));
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    window.scrollTo(0, 0);
  });
  await page
    .waitForFunction(
      () =>
        Array.from(document.images).every((img) => img.complete && img.naturalWidth > 0),
      undefined,
      { timeout: IMAGE_WAIT_TIMEOUT_MS },
    )
    .catch(() => undefined);
  await page.evaluate(() => document.fonts.ready).catch(() => undefined);
}

async function captureView(page: Page, view: ParityView): Promise<Buffer> {
  await page.setViewportSize({ width: view.width, height: 900 });
  await page.goto(view.path);
  await page.waitForLoadState("domcontentloaded");
  await prepareCapture(page);
  return page.screenshot({ fullPage: true });
}

test.describe("parity diff capability (synthetic)", () => {
  test("identical captures diff to zero; changed copy and height drift are priced", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.setContent(
      `<!doctype html><html><body style="margin:0"><p style="font:16px sans-serif">Approved copy, first line.</p></body></html>`,
    );
    const first = decodePng(await page.screenshot());
    const again = decodePng(await page.screenshot());
    const same = diffPng(first, again, PER_PIXEL_THRESHOLD);
    expect(same.ratio, "two captures of one page must diff to zero").toBe(0);

    await page.setContent(
      `<!doctype html><html><body style="margin:0"><p style="font:16px sans-serif">Changed copy, first line.</p></body></html>`,
    );
    const changed = diffPng(first, decodePng(await page.screenshot()), PER_PIXEL_THRESHOLD);
    expect(
      changed.ratio,
      "a copy change must price above zero — a diff that cannot see copy is not a guard",
    ).toBeGreaterThan(0);

    await page.setContent(
      `<!doctype html><html><body style="margin:0"><p style="font:16px sans-serif">Approved copy, first line.</p><p style="font:16px sans-serif">A second line the reference never renders.</p></body></html>`,
    );
    const taller = diffPng(first, decodePng(await page.screenshot()), PER_PIXEL_THRESHOLD);
    expect(
      taller.mismatched,
      "rows the shorter capture never renders must count as mismatched",
    ).toBeGreaterThan(0);
  });
});

for (const view of PARITY_VIEWS) {
  test(`parity ${view.id}`, async ({ page }) => {
    if (view.status === "pending" && !AUDIT) {
      test.skip(true, `pending — owned by ${view.owner}`);
    }
    const referencePath = join(REFERENCE_DIR, view.reference);
    expect(
      existsSync(referencePath),
      `parity ${view.id}: reference ${view.reference} must exist under tests/e2e/parity/reference/`,
    ).toBeTruthy();
    const reference = decodePng(readFileSync(referencePath));
    const actual = decodePng(await captureView(page, view));
    const result = diffPng(actual, reference, PER_PIXEL_THRESHOLD, view.masks ?? []);
    const limit = view.maxMismatchRatio ?? DEFAULT_MAX_MISMATCH_RATIO;
    if (AUDIT) {
      console.log(
        `parity audit ${view.id}: ratio ${result.ratio.toFixed(4)} (limit ${limit}), ${result.mismatched}/${result.total} px over ${result.width}x${result.height}`,
      );
      return;
    }
    expect(
      result.ratio,
      `parity ${view.id}: mismatch ratio ${result.ratio.toFixed(4)} exceeds the view's limit ${limit} (${result.mismatched}/${result.total} px) — the build no longer matches the approved reference ${view.reference}`,
    ).toBeLessThanOrEqual(limit);
  });
}
