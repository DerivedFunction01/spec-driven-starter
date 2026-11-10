#!/usr/bin/env python3
"""Sync spec-form files from this repo (canonical) to
repos carrying copies, per the untracked registry at
var/config/spec-sync.json. Default reports drift;
--apply copies canonical bytes over drifted copies."""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_REGISTRY = REPO_ROOT / "var" / "config" / "spec-sync.json"


def load_registry(path: Path) -> dict:
    if not path.is_file():
        print(f"registry not found: {path}")
        print("copy tools/spec-sync.example.json there and "
              "fill in this machine's repos")
        raise SystemExit(2)
    return json.loads(path.read_text(encoding="utf-8"))


def pairs(registry: dict):
    canonical = Path(registry["canonical_root"])
    for target in registry["targets"]:
        repo = Path(target["repo"])
        for entry in target["files"]:
            yield (target["name"], canonical / entry["source"],
                   repo / entry["dest"], entry["dest"])


def main(argv: list[str]) -> int:
    apply_mode = "--apply" in argv
    registry_path = DEFAULT_REGISTRY
    if "--registry" in argv:
        registry_path = Path(argv[argv.index("--registry") + 1])
    registry = load_registry(registry_path)
    problems = []
    ok_count = 0
    changed = 0
    for name, source, dest, dest_rel in pairs(registry):
        label = f"{name}:{dest_rel}"
        if not source.is_file():
            problems.append(f"missing-source {label}")
            continue
        if not dest.is_file():
            state = "missing-dest"
        elif source.read_bytes() == dest.read_bytes():
            ok_count += 1
            continue
        else:
            state = "drift"
        if apply_mode:
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, dest)
            changed += 1
            print(f"synced {label} (was {state})")
        else:
            problems.append(f"{state} {label}")
    for problem in problems:
        print(problem)
    print(f"{ok_count} ok, {changed} synced, "
          f"{len(problems)} problem(s)")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
