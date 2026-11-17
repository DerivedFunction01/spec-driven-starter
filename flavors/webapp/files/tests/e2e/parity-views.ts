/**
 * The parity manifest: every view with an approved design
 * reference (an approved mockup capture, or the kit
 * Specimen's approved render) that the parity leg diffs the
 * built app against. A rendered route with an approved
 * reference and no entry here is unenrolled — the project
 * keeps this file complete against its census
 * (surface-routes.ts) by its own check.
 *
 * Tolerance discipline (docs/checks.md, rendered legs):
 * - A pixel mismatches when any RGB channel differs by more
 *   than the per-pixel threshold (the spec's constant);
 *   that absorbs rasterisation and anti-aliasing noise and
 *   sits far below any real layout or copy change.
 * - A view passes at or under its mismatch ratio: the
 *   default in the spec, or the view's own
 *   `maxMismatchRatio` where the view's record argues one.
 * - Dynamic regions are masked here, in fractional
 *   coordinates, each with its reason — never by loosening
 *   the global numbers.
 * - `status: "pending"` views are skipped BY NAME in the
 *   leg's report, with their `owner` (the work that will
 *   make them assertable). Nothing is silently absent.
 * - References are approved artefacts, committed under
 *   tests/e2e/parity/reference/. Baselines are never auto-
 *   updated: a reference changes only through the design
 *   approval that changes the design.
 *
 * SEED STATE: the sample app renders no surface and carries
 * no approved design, so the manifest starts empty; the
 * leg's running proof in this seed is its synthetic
 * capability test. The first view with an approved reference
 * enrolls here, `pending` until its first audited pass.
 */

export interface ParityMask {
  x: number;
  y: number;
  width: number;
  height: number;
  reason: string;
}

export interface ParityView {
  id: string;
  /** The concrete seeded path the leg captures. */
  path: string;
  /** Capture viewport width (CSS px); height follows the full page. */
  width: number;
  /** Reference PNG, relative to tests/e2e/parity/reference/. */
  reference: string;
  status: "asserted" | "pending";
  /** The work that makes a pending view assertable; named for asserted views too, as provenance. */
  owner: string;
  maxMismatchRatio?: number;
  masks?: ParityMask[];
}

export const PARITY_VIEWS: ParityView[] = [];
