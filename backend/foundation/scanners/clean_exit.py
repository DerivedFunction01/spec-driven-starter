"""Clean-exit scanner: no process exits in library code.

Process-exit calls — ``sys.exit``, bare ``exit`` — are findings
in the foundation, domain, infra, and services tiers. ``apps``
is out of scope; below a ``__main__`` guard is allowed.
"""

from __future__ import annotations

import re
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import python_files, rel

LIBRARY_TIERS = ("foundation", "domain", "infra", "services")

SYS_EXIT_RE = re.compile(r"\bsys\.exit\s*\(")
BARE_EXIT_RE = re.compile(r"(?<![\w.])exit\s*\(")
MAIN_GUARD_RE = re.compile(r"^\s*if\s+__name__\s*==\s*['\"]__main__['\"]")


def _guard_line(lines: list[str]) -> int | None:
    for lineno, line in enumerate(lines, start=1):
        if MAIN_GUARD_RE.match(line):
            return lineno
    return None


def _scan_file(root: Path, path: Path) -> list[Finding]:
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except (OSError, UnicodeDecodeError):
        return []
    guard = _guard_line(lines)
    findings: list[Finding] = []
    for lineno, line in enumerate(lines, start=1):
        if guard is not None and lineno > guard:
            continue
        if SYS_EXIT_RE.search(line) or BARE_EXIT_RE.search(line):
            findings.append(
                Finding(
                    scanner="clean_exit",
                    rule="clean_exit/process-exit",
                    path=rel(root, path),
                    line=lineno,
                    message=(
                        "process exit in library code; raise an error "
                        "and let the entry point decide"
                    ),
                )
            )
    return findings


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for tier in LIBRARY_TIERS:
        for path in python_files(root, f"backend/{tier}"):
            findings.extend(_scan_file(root, path))
    return findings


SCANNER = Scanner(
    name="clean_exit",
    description="no sys.exit or bare exit in library tiers",
    run=scan,
)
