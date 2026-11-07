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
- `tools/check.mjs` — the composed check (below), with a
  `.prettierignore` that keeps build output out of the format
  leg.

## The check

```sh
pnpm install
pnpm check        # node tools/check.mjs
```

Fail-fast legs, mirroring the core gate's shape: typecheck +
build (`tsc -b`), format (prettier), the no-`any` rule, and
the tests (`node --test` over the built output — unit tests
plus HTTP smoke tests against the real server, the seed of the
e2e suite). `python3 check.py` still gates the repo as a
whole; this check is the additional leg for the TypeScript
side, and a landing needs both green.

## Contracts a project supplies

- **Standards:** `docs/web-stack-standards.md` binds the stack
  (validation at boundaries, route rules, token-only styling).
- **Tokens:** the UI context token file
  (`docs/ui-tokens-template.md`) is seeded before features, so
  no feature invents visual values.
- **Ignores:** add `node_modules/` and `dist/` to the
  project's `.gitignore` when the flavor is applied — build
  output and installed dependencies are never tracked.
