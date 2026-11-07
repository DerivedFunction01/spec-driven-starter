# Spec-Driven Starter

A reusable starting point for a project built spec-first: the
specification is reverse-engineered (or written) before code, the
backend owns semantics, the frontend is a consumer, and every
convention is enforced by a gate rather than remembered.

The sample domain is **field-kit inventory**: a small service that
tracks kits (a named bag of gear), the items in them, and whether
each kit is ready, low, or missing items. It is fiction, chosen
because it is small enough to read in one sitting and rich enough
to exhibit every layer. Replace it; keep the shape.

Two modes: **greenfield** (the default — declare it in
`SPEC.md` and follow the method as written) and **conversion**,
for replacing a working predecessor: characterization,
golden-fixture parity, and a verified swap, in
`docs/conversion.md`.

## Create a fresh instance

Everything below uses only this README.

```sh
# 1. Copy this tree to the new project's home and enter it.
cp -r spec-driven-starter my-project
cd my-project

# 2. Choose and apply a flavor (see flavors/README.md).
python3 tools/apply_flavor.py service   # or: tool | full-stack | webapp

# 3. Build the environment (stdlib-only sample: fast).
python3 init_venv.py

# 4. Run the gate. It must be green before any other work.
python3 check.py

# 5. Run the sample. It binds the settings seam's default
#    host and port; the one literal below is the quickstart's
#    documented instance of that default.
var/venv/bin/python -m backend.apps.server
# In another shell:
curl http://127.0.0.1:8797/health
# The model endpoint is /api/v1/model on the same address, and
# the frontend is served at the same address root — open it, or
# open frontend/index.html directly and point it at the server.

# 6. Or run it always-on, supervised (the kit in ops/ — see
#    "Supervision kit" in docs/primitives.md):
bash ops/install-unit.sh   # render + install the unit
bash ops/serve.sh start    # delegates to the supervisor
bash ops/watchdog.sh       # the restore ladder; silent while healthy
```

## Layout

```text
SPEC.md            index of the spec; carries no content of its own
spec/              the spec, in small files, split by track
API.md             the one seam between backend and frontend (versioned)
docs/              the method, fundamentals, primitives, checks,
                   and templates: spec, plan, fundamentals,
                   characterization, glossary, integration record,
                   UI tokens, discoverability, inspiration pins,
                   web-stack standards
backend/           layered Python: foundation, domain, infra,
                   services, apps (imports point downward only)
frontend/          a framework-free client; renders the API model,
                   recomputes nothing but arithmetic over served data
tools/             the flavor applier (scanners live in the backend)
flavors/           per-shape overlays over the shared core:
                   service, tool, full-stack, webapp (TypeScript)
ops/               the supervision kit: unit template, installer,
                   serve script, watchdog (docs/primitives.md)
deploy/            deploy script + the platform contracts it needs
tests/             the test suite (unittest style, run by pytest)
check.py           the gate: ruff, policy scanners, tests (docs/checks.md)
pyproject.toml     the tooling seam: pins + ruff/pytest config
init_venv.py       the environment builder (each repo owns its own)
workbench.yaml     the workbench manifest for plan/todo tracking
```

## The rules in one paragraph

Spec before code, per track, with a gate the owner rules on.
Backend does the work; frontend is a consumer. Layers import
downward only. Machine assumptions resolve through one settings
seam (`backend/foundation/settings.py`); no other module reads
the environment. No tracked file exceeds the gate's length cap, references a
file outside the repo, or carries a personal identifier — the
gate proves all three. Plans are written in the plan syntax in
`docs/plan-template.md`, tracked as one todo file per step, and
closed out (status set, file archived) in the same pass that
lands them. An approved mockup is an exact specification, not
inspiration; anything in it that real data cannot reproduce
returns as an explicit exception before a substitute ships.

Full method: `docs/method.md`.
