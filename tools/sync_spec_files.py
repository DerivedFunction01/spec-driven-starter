#!/usr/bin/env python3
"""Sync spec-form files from this repo (canonical) to repos
carrying copies, per var/config/spec-sync.json. Default
reports drift; --apply copies whole files and rewrites
marked fragment blocks between their markers in place."""

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
                   repo / entry["dest"], entry["dest"], entry)


def marker_pair(marker: str) -> tuple[bytes, bytes]:
    begin = f"<!-- spec-sync:{marker} -->".encode("utf-8")
    end = f"<!-- /spec-sync:{marker} -->".encode("utf-8")
    return begin, end


def fragment_result(dest_bytes: bytes, fragment_bytes: bytes,
                    marker: str) -> tuple[str, bytes | None]:
    if not marker:
        return "missing-markers", None
    begin, end = marker_pair(marker)
    start = dest_bytes.find(begin)
    if start == -1:
        return "missing-markers", None
    block_start = start + len(begin)
    stop = dest_bytes.find(end, block_start)
    if stop == -1:
        return "missing-markers", None
    if dest_bytes[block_start:stop] == fragment_bytes:
        return "ok", None
    new_bytes = (dest_bytes[:block_start] + fragment_bytes
                 + dest_bytes[stop:])
    return "fragment-drift", new_bytes


def main(argv: list[str]) -> int:
    apply_mode = "--apply" in argv
    registry_path = DEFAULT_REGISTRY
    if "--registry" in argv:
        registry_path = Path(argv[argv.index("--registry") + 1])
    registry = load_registry(registry_path)
    problems = []
    ok_count = 0
    changed = 0
    for name, source, dest, dest_rel, entry in pairs(registry):
        label = f"{name}:{dest_rel}"
        if not source.is_file():
            problems.append(f"missing-source {label}")
            continue
        if entry.get("kind") == "fragment":
            if not dest.is_file():
                problems.append(f"missing-dest {label}")
                continue
            state, new_bytes = fragment_result(
                dest.read_bytes(), source.read_bytes(),
                entry.get("marker", ""))
            if state == "ok":
                ok_count += 1
                continue
            if state == "missing-markers":
                problems.append(f"missing-markers {label}")
                continue
            if apply_mode:
                dest.write_bytes(new_bytes)
                changed += 1
                print(f"synced {label} (was {state})")
            else:
                problems.append(f"{state} {label}")
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
