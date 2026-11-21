# Flavor: webapp

A framework webapp on the TypeScript stack: a pnpm-workspace
monorepo laid over the starter core. The core still owns the
method, the spec, and the contract (`API.md`); this flavor adds
the typed stack a webapp grows — workspaces, shared types,
tooling, tests, and one composed check — so the next webapp
starts with them instead of growing each piece repo-side.

## What the overlay adds

- `package.json` + `pnpm-workspace.yaml` — the workspace root;
  pnpm is pinned in `packageManager`, so the version is a repo
  fact, not a machine fact.
- `tsconfig.base.json` — strict TypeScript, shared by every
  package (`strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`); the root `tsconfig.json`
  composes the packages by reference.
- `packages/contract/` — the shared types both sides of the
  seam compile against: a contract shape exists exactly once,
  here, never copied per side.
- `apps/web/` — the sample app: one typed server (node:http,
  no framework — the framework is the project's choice, kept
  to the conventions in `docs/web-stack-standards.md`) serving
  the contract's health and problem-details shapes.
- `packages/ui-kit/` — the starter UI kit, seeded as a
  copied package the project owns (`@starter/ui-kit`):
  tokens, the deterministic generator, the primitives, the
  Specimen, and the contrast gate. Re-seed its palette in
  the project's design pass; its gate and primitives are
  the fixed machinery. It is excluded from the format leg
  (`.prettierignore`): its themes are generated and its
  sources carry the kit's own formatting — the composed
  check gates it through the kit legs below instead.
- `tools/check.mjs` — the composed check (below), with a
  `.prettierignore` that keeps build output out of the format
  leg.

## The check

```sh
pnpm install
pnpm check        # node tools/check.mjs
```

Aggregate-then-verdict: a pre-flight parse guard
(`node --check` over the check's own modules and data
files — a file that does not parse is a leg that silently
never ran) runs first; then every leg runs — typecheck +
build (`tsc -b`), format (prettier), the no-`any` rule,
the surface checks (raw elements, value slots, dead
classes, allowlist data in `tools/check-data.mjs`), the
kit legs, and the tests (`node --test` over the built
output — unit tests plus HTTP smoke tests against the real
server, the seed of the e2e suite) — and the verdict falls
at the end, naming every failed leg. The kit legs run when
the project carries `packages/ui-kit`, in served-by form:
token regeneration must be byte-identical to the checked-in
themes, the kit's contrast gate must pass, and the kit's
own declared `typecheck` script runs under its package
name. `python3 check.py` still gates the repo as a
whole; this check is the additional leg for the TypeScript
side, and a landing needs both green.

## Contracts a project supplies

- **Standards:** `docs/web-stack-standards.md` binds the stack
  (validation at boundaries, route rules, token-only styling).
- **Tokens:** the seeded UI kit (`packages/ui-kit`) is the
  token file, seeded before features, so no feature invents
  visual values; its palette is re-seeded in the design
  pass. (A project that drops the kit falls back to the UI
  context token file, `docs/templates/ui-tokens-template.md`.)
- **Ignores:** add `node_modules/` and `dist/` to the
  project's `.gitignore` when the flavor is applied — build
  output and installed dependencies are never tracked.
