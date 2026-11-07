# Agent entry point

Read in order: `SPEC.md` (index only), your track's files under
`spec/`, `API.md` (the only backend/frontend seam), then
`docs/fundamentals.md`. The method itself is `docs/method.md`.
When `SPEC.md` declares `Mode: conversion`, read
`docs/conversion.md` after the spec files, before code.

This file is the repo's one instruction source. Any other
harness's file (a bridge file, an editor-rules entry) is a
thin pointer to this file, never a copy of its content.

Hard rules:

- No application code before the spec gate for its track is ruled.
- Two tracks, one seam. Neither track imports the other's code.
  The backend owns derivations, status semantics, and label
  mappings, served display-ready; the frontend renders and may
  only do arithmetic over served data.
- Layers import downward only: apps -> services -> infra/domain
  -> foundation. Foundation imports nothing internal. Domain is
  pure: no I/O, no environment, no clock.
- Settings seam: only `backend/foundation/settings.py` reads the
  environment. Everything else receives values.
- No reexports, no shims. Import from the leaf module.
- Runtime state lives under `var/` and is never tracked.
- Gate before landing: `python3 check.py` green (ruff format+lint, policy scanners, tests). Never invent a command for this file.
