# Full-stack release checklist

- [ ] `python3 check.py` green on the exact tree being released.
- [ ] `API.md` contract version in the model payload matches
      the version the frontend was built against.
- [ ] Frontend reaches the API at the base it was served from;
      no second, hard-coded data path.
- [ ] Every rendered control dispatches a declared action or
      follows a served link; no decorative controls.
- [ ] Empty states render honestly (nothing fabricated to fill
      a tile, a list, or a chart).
- [ ] Deploy ran via `deploy/deploy.sh` and its health check
      passed against the deployed target, not the dev tree.
- [ ] If the served app is kept always-on: the supervision
      kit is installed (`ops/install-unit.sh`) and the
      watchdog drills pass (unit reinstalled when missing,
      server restored when down, failure loud).
