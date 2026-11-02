# Flavor: service

A long-running program that owns repeating work. The registry
is the description of record: every repeating job is described
exactly once, in a registry entry; adding a job is adding an
entry, never adding a separate scheduler per job.

## What the overlay adds

- `jobs/example-kit-check.yaml` — one example registry entry.
- `jobs/README.md` — the entry schema.
- `bodies/example-kit-check.md` — the instruction data an agent
  or operator works when the job escalates. Bodies are data;
  the server never executes a body.

## Contracts a host must supply (specified, not assumed)

- **Supervisor:** something starts the server at boot and
  restarts it on failure (a service manager, a container
  runtime, or a documented manual start).
- **Keeper:** an external poller that health-checks
  `GET /health`, restarts the server on failure, and surfaces
  pending escalations to the operator's work surface.
- **State:** the server's runtime state lives under `var/`,
  is regenerable, and is never tracked.

## Classification rule for jobs

A job is automated end-to-end only when its work is a fixed
command sequence, every outcome branches on results enumerable
in advance, and when it speaks is fully determined by those
branches. Anything needing judgment over content is an
operator/agent job whose entry carries a body.
