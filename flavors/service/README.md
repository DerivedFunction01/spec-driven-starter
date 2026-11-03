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

- **Supervisor:** the core supervision kit (`ops/`) is the
  mechanism. `install-unit.sh` renders the unit from the
  settings seam — a service instance names its own unit via
  `FIELDKIT_UNIT` — the supervisor starts the server at boot
  and restarts it on failure, and `serve.sh` delegates to the
  supervisor whenever the unit is installed.
- **Keeper:** an external poller that runs `ops/watchdog.sh`
  on an interval — the restore ladder behind the Supervisor
  contract — and surfaces its failures (a nonzero exit, with
  the note in `var/state/<unit>.log`) and pending escalations
  to the operator's work surface. A healthy poll is silent.
- **State:** the server's runtime state lives under `var/`,
  is regenerable, and is never tracked.

## Classification rule for jobs

A job is automated end-to-end only when its work is a fixed
command sequence, every outcome branches on results enumerable
in advance, and when it speaks is fully determined by those
branches. Anything needing judgment over content is an
operator/agent job whose entry carries a body.
