# Web-stack code standards

The standards for a project on the framework webapp stack (the
`webapp` flavor). The starter's fundamentals govern layering
and seams on every stack; this file governs the TypeScript
side's own conventions. A project on another stack does not
carry it.

## Language

- TypeScript strict, always: `strict`, no implicit `any`,
  `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` —
  the base tsconfig the flavor ships is the floor, not a
  starting suggestion.
- No `any` — enforced by the flavor's check. An unknown value
  is `unknown` and is narrowed; an external value is validated
  (below) before it is typed.
- Validation at system boundaries: request bodies, query
  parameters, provider responses, and stored payloads are
  parsed against a schema at the boundary; inside the
  boundary, types are trusted and not re-checked.

## Framework conventions

- Server components by default; a client component only where
  interactivity requires it, marked as such, and kept small —
  the default question is "why does this need the client?",
  not the reverse.
- Route handlers are single-responsibility: one route, one
  action; shared work moves behind the seam into a service,
  never into a second route's handler.
- Data fetching happens server-side against the project's own
  services; components receive display-ready data (the backend
  owns semantics — the core fundamentals — on this stack too).

## API route rules

- Validate before logic: a request that fails its schema is
  answered before any business rule runs.
- Authenticate, then authorize ownership, before any mutation
  — in that order, per object (the security baseline in
  fundamentals).
- Consistent response shapes: success payloads follow the
  contract; errors are problem details (`API.md`), never a
  per-route invention.

## Styling

- Token-only styling: components reference the UI context
  tokens (`docs/ui-tokens-template.md`) — color roles,
  typography, radius — never raw values. A value with no token
  is a token-file amendment first, a component change second.
