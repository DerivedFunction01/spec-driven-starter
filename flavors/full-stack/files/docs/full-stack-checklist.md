# Full-stack release checklist

- [ ] `bash check.sh` green on the exact tree being released.
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
