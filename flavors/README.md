# Flavors

The core is one layered skeleton that runs as-is. A **flavor**
is an additive overlay that shapes the core for one kind of
project, without editing core files:

```sh
python3 tools/apply_flavor.py <flavor>
```

The applier copies `flavors/<name>/files/` over the repo root
and records the choice in `var/flavor.txt`. Inspect the overlay
directory before applying; switching flavors is additive too
(remove the files a previous flavor added if you change your
mind — they are listed when the applier runs).

## Choosing

The flavor choice follows the intake's audience-and-
persistence declaration (`docs/method.md`): who uses the app,
whether their entries are saved, and whether it needs a public
link, a custom domain, or a team. A project whose entries are
not saved and whose audience is the operator alone is rarely a
service; a project with a public link and saved entries is
never just a tool. Rule the tradeoff in the intake record,
then pick from this table.

| Flavor | Choose when | What it adds |
| --- | --- | --- |
| `service` | A long-running program owns repeating work: it serves requests, runs scheduled jobs, keeps state. | A job registry example + schema doc, an example job body, and the supervisor/keeper contract notes in the overlay README. |
| `tool` | A command-line tool other programs lease or call: wrappers in `bin/`, config is data, each target repo or resource builds its own environment. | `bin/` wrappers, a `config/*.example` registry pattern (pointers only — package specs live in each target's own builder, never in the registry), and a probe script shape. |
| `full-stack` | Backend and a real frontend ship together behind one contract (the core's own shape). | Nothing structural — the core *is* the full-stack shape. The overlay adds the two-track gate checklist and the deploy wiring for serving the frontend with the API. |
| `webapp` | The project is a framework webapp on the TypeScript stack: typed client and server, shared types across the seam, framework conventions. | A pnpm-workspace monorepo (`apps/*`, `packages/*`), shared strict tsconfig, a shared contract types package, unit + smoke test wiring, and one composed check script (`tools/check.mjs`). The core's method, spec, and `API.md` contract still govern; the standards are `docs/web-stack-standards.md`. |

Rule of thumb: if it runs when nobody is looking, it is a
service. If it runs only when invoked and its value is a result
handed back to a caller, it is a tool. If a human uses it
through a UI the project ships, it is full-stack (possibly also
one of the others underneath).
