/**
 * The dead-click sweep's engine: every visible, enabled
 * control in a swept landmark is clicked for real, and a
 * click counts only when it produces an observable effect —
 * a navigation, a hash change, a dialog opening or closing,
 * the control's own aria-expanded / aria-pressed / checked
 * flipping, the appearance-mode attribute changing, a popup
 * (for target=_blank), or the landmark itself closing (a
 * drawer's Close button changes none of the other reads).
 *
 * Safety rules (recorded, never silent):
 * - Controls whose accessible name matches the mutating set
 *   (sign out, delete, remove, deactivate, reset, save,
 *   submit, dismiss, pay, cancel) are SKIPPED with the
 *   reason in the verdict: a chrome sweep must never mutate
 *   state or end the session to prove a control is alive —
 *   those controls are exercised by their own surfaces'
 *   specs.
 * - tel: / mailto: links are verified by scheme, not
 *   clicked: the href IS the effect contract, and a headless
 *   click on tel: proves nothing.
 * - Self-links (an href resolving to exactly the current
 *   route — same path, query, and hash) are verified by the
 *   same href contract, not clicked: a same-route navigation
 *   has no observable delta to measure, and the current
 *   item staying a live link is the ruled shape. Fragment-
 *   only hrefs ("#", "#target") are never this class: they
 *   name an in-page anchor, and a bare "#" with a suppressed
 *   default is a dead control the sweep must stay able to
 *   catch.
 *
 * Controls are re-found by IDENTITY (accessible name + href
 * + ordinal among controls sharing that identity), never by
 * position in a fresh collection: the collection filters
 * hidden and disabled controls out, so a positional index
 * into an unfiltered NodeList clicks the wrong control
 * whenever any earlier sibling was filtered.
 */
import { expect, type Locator, type Page } from "@playwright/test";

export interface SweepCandidate {
  name: string;
  href: string | null;
  blank: boolean;
  scheme: "tel" | "mailto" | null;
  mutating: boolean;
  /** Ordinal among the candidates sharing this identity. */
  keyIndex: number;
}

export interface SweepVerdict {
  name: string;
  outcome: "effect" | "dead" | "not-actionable" | "skipped";
  detail: string;
}

interface CollectedRow extends Omit<SweepCandidate, "scheme"> {
  scheme: string | null;
  /** Index into the landmark's raw `a[href], button` NodeList. */
  domIndex: number;
}

/**
 * The one in-page collection pass (serialized into the
 * page, so it stays self-contained): every visible, enabled
 * control in the landmark, with its raw NodeList index.
 * Collection and re-finding spend this one filter, so the
 * two can never drift apart.
 */
function collectInPage(root: Element): CollectedRow[] {
  const mutating =
    /sign out|log out|delete|remove|deactivate|reset|save|submit|dismiss|pay\b|cancel/i;
  const out: CollectedRow[] = [];
  root.querySelectorAll("a[href], button").forEach((el, domIndex) => {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return;
    if (el.getClientRects().length === 0) return;
    if ((el as HTMLButtonElement).disabled) return;
    const name = (el.getAttribute("aria-label") ?? el.textContent ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 60);
    const href = el instanceof HTMLAnchorElement ? el.getAttribute("href") : null;
    out.push({
      domIndex,
      name: name || "(unnamed control)",
      href,
      blank: el instanceof HTMLAnchorElement && el.target === "_blank",
      scheme: href?.startsWith("tel:") ? "tel" : href?.startsWith("mailto:") ? "mailto" : null,
      mutating: mutating.test(name || ""),
      keyIndex: 0,
    });
  });
  return out;
}

/** Collect the landmark's clickable candidates, in DOM order. */
export async function collectCandidates(landmark: Locator): Promise<SweepCandidate[]> {
  const rows = (await landmark.evaluate(collectInPage)) as CollectedRow[];
  const counts = new Map<string, number>();
  return rows.map((row) => {
    const key = `${row.name}\n${row.href ?? ""}`;
    const keyIndex = counts.get(key) ?? 0;
    counts.set(key, keyIndex + 1);
    return {
      name: row.name,
      href: row.href,
      blank: row.blank,
      scheme: row.scheme as SweepCandidate["scheme"],
      mutating: row.mutating,
      keyIndex,
    };
  });
}

/**
 * Re-find a candidate in the landmark's CURRENT DOM: the
 * raw NodeList index of the keyIndex-th visible control
 * carrying the candidate's identity, or -1 when it is gone.
 */
export async function findCandidateDomIndex(
  landmark: Locator,
  candidate: SweepCandidate,
): Promise<number> {
  const rows = (await landmark.evaluate(collectInPage)) as CollectedRow[];
  let seen = 0;
  for (const row of rows) {
    if (row.name === candidate.name && row.href === candidate.href) {
      if (seen === candidate.keyIndex) return row.domIndex;
      seen += 1;
    }
  }
  return -1;
}

function isSelfHref(href: string, currentUrl: string): boolean {
  if (href.trim().startsWith("#")) return false;
  try {
    const target = new URL(href, currentUrl);
    const current = new URL(currentUrl);
    return (
      target.pathname === current.pathname &&
      target.search === current.search &&
      target.hash === current.hash
    );
  } catch {
    return false;
  }
}

interface Probe {
  url: string;
  hash: string;
  dialogs: number;
  mode: string | null;
}

async function probe(page: Page): Promise<Probe> {
  const read = () =>
    page.evaluate(() => ({
      url: location.href,
      hash: location.hash,
      dialogs: Array.from(document.querySelectorAll('[role="dialog"]')).filter(
        (d) => d.getClientRects().length > 0,
      ).length,
      // documentElement can be null while a navigation's new
      // document is being born; a not-yet-formed document
      // carries no mode, and the caller's settled re-reads
      // measure the real page.
      mode:
        document.documentElement?.getAttribute("data-mode") ??
        document.documentElement?.getAttribute("data-theme") ??
        null,
    }));
  try {
    return await read();
  } catch (err) {
    // A click's navigation can still be in flight when the
    // sweep reads, destroying the execution context mid-
    // evaluate. The probe's contract is the SETTLED page
    // state: wait for the navigation to commit, read again.
    // Any other error is the sweep's own and rethrows.
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("Execution context was destroyed")) throw err;
    await page.waitForLoadState("load").catch(() => undefined);
    return read();
  }
}

/**
 * A control's own state string. The read is BOUNDED: after
 * a click that navigates somewhere the control never
 * re-attaches, an unbounded locator read never settles and
 * the sweep hangs with no verdict — an element that has not
 * re-attached within the click's own budget is "gone".
 */
async function controlState(control: Locator): Promise<string> {
  const read = control
    .evaluate(
      (el) =>
        `${el.getAttribute("aria-expanded") ?? ""}|${el.getAttribute("aria-pressed") ?? ""}|${(el as HTMLInputElement).checked ?? ""}`,
    )
    .catch(() => "gone");
  const bounded = new Promise<string>((resolve) => {
    setTimeout(() => resolve("gone"), 3_000);
  });
  return Promise.race([read, bounded]);
}

/** Is the landmark itself rendered and at least partly on-canvas? Bounded, as above. */
async function landmarkRendered(landmark: Locator): Promise<boolean> {
  const read = landmark
    .evaluate((el) => {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.right > 0 && rect.left < window.innerWidth;
    })
    .catch(() => false);
  const bounded = new Promise<boolean>((resolve) => {
    setTimeout(() => resolve(false), 3_000);
  });
  return Promise.race([read, bounded]);
}

/**
 * Sweep one landmark's controls on the CURRENT page. The
 * caller owns the page's home state: `restore` must return
 * the page to the swept route whenever a click's aftermath
 * cannot be unwound (goBack + Escape are tried first).
 * Every click starts from the home state — a previous
 * click's aftermath is restored BEFORE the next candidate,
 * never discovered through the next candidate's verdict.
 */
export async function sweepLandmark(
  page: Page,
  landmarkSelector: string,
  restore: () => Promise<void>,
): Promise<SweepVerdict[]> {
  const landmark = page.locator(landmarkSelector).first();
  await expect(landmark, `sweep: landmark ${landmarkSelector} must exist`).toHaveCount(1);
  const candidates = await collectCandidates(landmark);
  const home = await probe(page);
  const verdicts: SweepVerdict[] = [];

  for (const candidate of candidates) {
    if (candidate.mutating) {
      verdicts.push({
        name: candidate.name,
        outcome: "skipped",
        detail: "mutating/session control — exercised by its own surface's specs",
      });
      continue;
    }
    if (candidate.scheme) {
      verdicts.push({
        name: candidate.name,
        outcome: "effect",
        detail: `${candidate.scheme}: scheme link — href is the effect contract`,
      });
      continue;
    }
    if (candidate.href && isSelfHref(candidate.href, home.url)) {
      verdicts.push({
        name: candidate.name,
        outcome: "effect",
        detail: `href contract — ${candidate.href} is the current route (self-link)`,
      });
      continue;
    }

    if (
      (await probe(page)).url !== home.url ||
      !(await landmarkRendered(page.locator(landmarkSelector).first()))
    ) {
      await restore();
    }

    const fresh = page.locator(landmarkSelector).first();
    const domIndex = await findCandidateDomIndex(fresh, candidate);
    if (domIndex < 0) {
      verdicts.push({ name: candidate.name, outcome: "not-actionable", detail: "control vanished" });
      continue;
    }
    const control = fresh.locator("a[href], button").nth(domIndex);
    const before = await probe(page);
    const stateBefore = await controlState(control);
    const renderedBefore = await landmarkRendered(fresh);
    let popupOpened = false;
    const popupPromise = candidate.blank
      ? page
          .context()
          .waitForEvent("page", { timeout: 2_500 })
          .then(async (popup) => {
            popupOpened = true;
            await popup.close().catch(() => undefined);
          })
          .catch(() => undefined)
      : Promise.resolve();

    let clickError: string | null = null;
    await control.click({ timeout: 3_000 }).catch((err: Error) => {
      clickError = err.message.split("\n")[0] ?? "click failed";
    });
    await popupPromise;
    if (clickError) {
      verdicts.push({ name: candidate.name, outcome: "not-actionable", detail: clickError });
      await restore();
      continue;
    }
    await page.waitForTimeout(250);
    const after = await probe(page);
    // A click that navigated destroyed the control's
    // document; its state is "gone" by construction, and a
    // positional read on the new page would name a different
    // control anyway.
    const stateAfter = after.url !== before.url ? "gone" : await controlState(control);
    const effects: string[] = [];
    if (popupOpened) effects.push("popup opened");
    if (after.url !== before.url) effects.push(`navigated to ${after.url}`);
    if (after.hash !== before.hash) effects.push("hash changed");
    if (after.dialogs !== before.dialogs) effects.push("dialog count changed");
    if (after.mode !== before.mode) effects.push("appearance mode changed");
    if (stateAfter !== stateBefore) effects.push("control state flipped");
    let renderedAfter = after.url !== before.url ? false : await landmarkRendered(fresh);
    if (renderedBefore && !renderedAfter && after.url === before.url) {
      effects.push("landmark closed");
    }
    if (effects.length === 0 && after.url === before.url) {
      // One bounded second look before the harshest verdict:
      // a close can ride a transition the fixed settle
      // straddles. A truly dead control still reads dead
      // after the window; nothing here manufactures an
      // effect — it only waits for the one in flight.
      await page.waitForTimeout(400);
      const after2 = await probe(page);
      renderedAfter = await landmarkRendered(fresh);
      if (after2.url !== before.url) effects.push(`navigated to ${after2.url}`);
      else if (renderedBefore && !renderedAfter) effects.push("landmark closed");
      else if (after2.dialogs !== before.dialogs) effects.push("dialog count changed");
    }
    verdicts.push(
      effects.length > 0
        ? { name: candidate.name, outcome: "effect", detail: effects.join("; ") }
        : { name: candidate.name, outcome: "dead", detail: "click produced no observable effect" },
    );

    // Unwind: back if we left, Escape for dialogs and for a
    // disclosure overlay (which moves neither the URL nor a
    // role=dialog, so the reads above cannot see it — the
    // next candidate must not be clicked under it), and the
    // caller's full restore when the page no longer matches
    // home or the landmark itself was closed by the click.
    const now = await probe(page);
    if (now.url !== home.url) {
      await page.goBack().catch(() => undefined);
      await page.waitForLoadState("domcontentloaded").catch(() => undefined);
    }
    if ((await probe(page)).dialogs > home.dialogs) {
      await page.keyboard.press("Escape").catch(() => undefined);
    }
    const disclosureOpened =
      stateAfter !== "gone" &&
      stateBefore.split("|")[0] !== "true" &&
      stateAfter.split("|")[0] === "true";
    if (disclosureOpened) {
      await page.keyboard.press("Escape").catch(() => undefined);
    }
    if ((await probe(page)).url !== home.url) {
      await restore();
    } else if (
      disclosureOpened ||
      !(await landmarkRendered(page.locator(landmarkSelector).first()))
    ) {
      const settledIndex = await findCandidateDomIndex(
        page.locator(landmarkSelector).first(),
        candidate,
      );
      const stillOpen =
        disclosureOpened &&
        settledIndex >= 0 &&
        (await controlState(
          page.locator(landmarkSelector).first().locator("a[href], button").nth(settledIndex),
        )).split("|")[0] === "true";
      if (stillOpen || !(await landmarkRendered(page.locator(landmarkSelector).first()))) {
        await restore();
      }
    }
  }
  return verdicts;
}

/** Assert a landmark's verdicts contain no dead or unactionable control. */
export function expectNoDeadClicks(scope: string, verdicts: SweepVerdict[]): void {
  const bad = verdicts.filter((v) => v.outcome === "dead" || v.outcome === "not-actionable");
  expect(
    bad,
    `${scope}: ${bad.length} dead/unactionable control(s): ${JSON.stringify(bad)} (full sweep: ${JSON.stringify(verdicts)})`,
  ).toEqual([]);
}
