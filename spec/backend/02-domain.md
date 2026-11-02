# §2 Domain rules (sample)

- **§2.1 Kit.** A kit has an id, a name, and items. An item has
  a name, a `have` count, and a `need` count (the count a
  complete kit carries).
- **§2.2 Missing.** An item is missing units when `have < need`;
  the shortfall is `need - have`. A kit's `missing` list carries
  every short item with its `short_by`.
- **§2.3 Status derivation.** Exactly one status per kit:
  `incomplete` when any item has a shortfall; else `low` when
  any item's `have` is at or below the low-stock threshold above
  its `need` (default threshold: 1 spare); else `ready`. A kit
  with no items serves status `null` — readiness is not
  invented for an uncaptured kit.
- **§2.4 Labels.** The backend maps each status to its label
  (`ready` -> "Ready", `low` -> "Low stock", `incomplete` ->
  "Incomplete") in exactly one place: the model builder.
