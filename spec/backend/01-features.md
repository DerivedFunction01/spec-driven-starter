# §1 Backend features (sample)

- **§1.1 Model build.** One function builds the whole display
  model from the store: kits, per-kit status and label, missing
  items, and totals. Served at `GET /api/v1/model`.
- **§1.2 Health.** `GET /health` answers status and the contract
  version, with no store access — a supervisor can probe it
  before data exists.
- **§1.3 Store.** Kits persist through the store seam
  (`docs/primitives.md`). The sample ships a memory store seeded
  with fictional data and a JSON file store for real use.
- **§1.4 Not shipped.** No accounts, no editing endpoints, no
  notifications. Deliberate gaps are recorded here, not left as
  stubs in code.
