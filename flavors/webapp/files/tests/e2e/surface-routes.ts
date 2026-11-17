/**
 * The surface census: every user-facing route the rendered
 * legs (qa-axe, qa-geometry, qa-truncation, qa-dead-click,
 * qa-parity) measure, enrolled here — the legs iterate this
 * file and nothing else, so a route no leg can see is a
 * route no leg pretends to cover.
 *
 * Enrollment discipline (docs/checks.md, rendered legs): a
 * route joins the census when it is built, not after it
 * breaks. A route that cannot yet pass a leg is enrolled
 * with the measured failure recorded beside it and named in
 * the leg's report — the record carries the defect; it does
 * not excuse it, and the route's bars apply in full when the
 * defect is fixed. A route with an approved design reference
 * also joins the parity manifest (parity-views.ts); a route
 * in neither file is unenrolled, and the project keeps the
 * two files complete against its router by its own census
 * check (the starter's route_coverage scanner enrolls the
 * backend's routes; the rendered census is this file).
 *
 * `pattern` is the router's route (dynamic segments as
 * [param]); `path` is the concrete seeded path the legs
 * drive. `landmarks` names the navigation-chrome landmark
 * selectors the dead-click sweep works over on this route.
 * `rendered: false` marks a transport route (a JSON or
 * download endpoint): enrolled so the census is complete,
 * skipped by every rendered leg by name.
 *
 * SEED STATE: the sample app serves exactly one route, the
 * JSON health endpoint — it renders nothing, so the rendered
 * census below starts empty and the legs' running proof in
 * this seed is their synthetic capability tests. The first
 * rendered route a project builds enrolls here with
 * `rendered: true`, and the legs measure it from that commit.
 */

export interface SurfaceRoute {
  pattern: string;
  path: string;
  rendered: boolean;
  landmarks?: string[];
}

export const SURFACE_ROUTES: SurfaceRoute[] = [
  { pattern: "/health", path: "/health", rendered: false },
];

export const RENDERED_ROUTES: SurfaceRoute[] = SURFACE_ROUTES.filter(
  (route) => route.rendered,
);

/**
 * The appearance modes the legs exercise, in order. A
 * product with one appearance carries ["light"]; a product
 * with a second mode adds it here and implements the switch
 * in qa-fixtures.ts (applyMode) — the legs pick the axis up
 * from this list, never from their own constants.
 */
export const SURFACE_MODES = ["light"] as const;
export type SurfaceMode = (typeof SURFACE_MODES)[number];
