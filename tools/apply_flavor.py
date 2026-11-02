#!/usr/bin/env python3
"""Apply a flavor overlay to this repo (see flavors/README.md).

Usage: python3 tools/apply_flavor.py <service|tool|full-stack>

Copies flavors/<name>/files/ over the repo root. Overlay files
are additive examples (a registry entry, a CLI wrapper, a
config example): applying a flavor never edits core files, so
re-applying or switching is safe to inspect with a diff first.
A marker is written to var/flavor.txt (runtime state, untracked)
recording the choice.
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]


def main(argv: list[str]) -> int:
    if len(argv) != 1:
        print(__doc__)
        return 2
    flavor = argv[0]
    source = REPO_ROOT / "flavors" / flavor / "files"
    if not source.is_dir():
        print(f"unknown flavor: {flavor}")
        return 2
    copied = []
    for path in sorted(source.rglob("*")):
        if path.is_file():
            rel = path.relative_to(source)
            dest = REPO_ROOT / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(path, dest)
            if dest.suffix in {".sh"} or dest.parent.name == "bin":
                dest.chmod(0o755)
            copied.append(str(rel))
    marker = REPO_ROOT / "var" / "flavor.txt"
    marker.parent.mkdir(parents=True, exist_ok=True)
    marker.write_text(flavor + "\n", encoding="utf-8")
    print(f"flavor applied: {flavor}")
    for rel in copied:
        print(f"  + {rel}")
    print("next: python3 init_venv.py && bash check.sh")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
