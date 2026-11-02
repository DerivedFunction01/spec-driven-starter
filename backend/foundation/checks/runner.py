"""Gate runner over the registered policy scanners.

Runs every scanner in ``ALL_SCANNERS`` against a repo root and
returns the exit code: 1 when any error-severity finding exists.
Notice findings print but never fail, and never pass silently.
"""

from __future__ import annotations

import sys
from pathlib import Path

from backend.foundation.scanners.base import SEVERITY_ERROR, Scanner
from backend.foundation.scanners.registry import ALL_SCANNERS


def registered() -> tuple[Scanner, ...]:
    return ALL_SCANNERS


def default_root() -> Path:
    """Repo root: three levels up from this file."""
    return Path(__file__).resolve().parents[3]


def run_all(root: Path | None = None) -> int:
    """Execute all registered scanners; print; return exit code."""
    root = (root or default_root()).resolve()
    scanners = registered()
    failures = 0
    for scanner in scanners:
        findings = scanner.run(root)
        errors = [f for f in findings if f.severity == SEVERITY_ERROR]
        notices = [f for f in findings if f.severity != SEVERITY_ERROR]
        if errors:
            failures += 1
            print(f"==> [{scanner.name}] FAIL ({len(errors)} finding(s))")
        elif notices:
            print(f"==> [{scanner.name}] ok ({len(notices)} notice(s))")
        else:
            print(f"==> [{scanner.name}] ok")
        for finding in findings:
            location = finding.path
            if finding.line is not None:
                location = f"{location}:{finding.line}"
            level = "ERROR" if finding.severity == SEVERITY_ERROR else "NOTICE"
            print(f"    {level} [{finding.rule}] {location}: {finding.message}")
    total = len(scanners)
    if failures:
        print(f"==> scanners: {total - failures}/{total} clean, {failures} failed")
        return 1
    print(f"==> scanners: {total}/{total} clean")
    return 0


def main() -> int:
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else None
    return run_all(root)


if __name__ == "__main__":
    raise SystemExit(main())
