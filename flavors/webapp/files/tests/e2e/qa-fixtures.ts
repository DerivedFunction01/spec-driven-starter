/**
 * Shared fixtures for the rendered legs: the contract
 * viewports, the census drive, and the appearance-mode seam.
 * Fixtures seed themselves against the suite's own server
 * and scratch state (playwright.config.ts) — nothing here
 * reads live or untracked state.
 */
import { expect, type Page } from "@playwright/test";
import type { SurfaceMode, SurfaceRoute } from "./surface-routes";

/** The contract widths: phone, tablet, desktop. */
export const CONTRACT_VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
] as const;

/**
 * Drive to a census route and prove the drive arrived: the
 * response is ok and the document carries a main landmark
 * or a heading — a leg that measures an error page or a
 * blank shell is measuring the drive, not the surface, and
 * says so here instead of reporting the surface clean.
 * Projects with sign-in or seeded-state setups extend this
 * one drive (per-route setup belongs to the census entry's
 * project, behind this seam), never per-leg copies of it.
 */
export async function driveToRoute(page: Page, route: SurfaceRoute): Promise<void> {
  const response = await page.goto(route.path);
  expect(
    response?.ok(),
    `drive: GET ${route.path} must answer ok before any leg measures it`,
  ).toBeTruthy();
  await page.waitForLoadState("domcontentloaded");
  await expect(
    page.locator("main, h1").first(),
    `drive: ${route.pattern} must render a main landmark or a heading`,
  ).toBeVisible();
}

/**
 * Put the page into an appearance mode. The seed product
 * carries one mode, so "light" is the rendering itself and
 * there is nothing to switch. A two-mode product implements
 * its own mechanism here (its theme cookie, storage key, or
 * attribute) and, where the mode is DOM-observable, asserts
 * it — the axe leg's per-mode runs rely on this seam having
 * actually switched the appearance, not on the leg's say-so.
 */
export async function applyMode(page: Page, mode: SurfaceMode): Promise<void> {
  void page;
  void mode;
}
