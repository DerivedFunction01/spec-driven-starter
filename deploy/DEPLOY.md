# Deploy contracts

Deployment is specified by contract, so the starter works on
any platform that can supply the four functions. The reference
implementation (`deploy/deploy.sh`) targets a local directory;
a real host replaces stage 3 and keeps the other stages.

## The four stages

1. **Gate.** `python3 check.py` green on the exact tree being
   deployed. A red gate stops the deploy; it is never waived.
2. **Build.** `python3 init_venv.py` produces the environment
   from the repo's own spec. No step reaches outside the repo
   except the package index the builder already uses.
3. **Publish.** Copy or sync the runnable tree (backend +
   frontend) to the host's serving location. The publisher
   must be able to state, afterwards, which tree is live —
   a drift check between source and target is the mechanism.
4. **Verify in the target context.** Start what was published
   and answer `GET /health` from it. A success in a developer
   shell proves nothing about the published copy; verification
   runs against the target, in the target's environment.

## Platform-bound functions, by contract

- **Supervisor:** starts the server (`python -m
  backend.apps.server`, working directory = repo root, host and
  port from the settings seam's environment) and restarts it on
  failure.
- **Publisher for a hosted frontend:** if the frontend is
  hosted separately from the backend, the publisher places the
  static files and the client must still reach the API at its
  configured base — the contract in `API.md` does not change.
- **Keeper (service flavor):** an external poller that
  health-checks the server and surfaces failures to the
  operator; it never edits the repo or the registry itself.
