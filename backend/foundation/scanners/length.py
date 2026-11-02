"""File-length scanner: the line cap in ``MAX_LINES``.

Any scanned file over the cap is a finding; at the cap the
promotion rule applies (module folder split by intent). Covers
Python everywhere plus the frontend's script files.
"""

from __future__ import annotations

from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import python_files, rel, walk_files

MAX_LINES = 800

FRONTEND_TREES: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("frontend", (".js", ".mjs")),
)


def frontend_files(root: Path) -> list[Path]:
    """The frontend script files of ``FRONTEND_TREES`` under ``root``."""
    found: list[Path] = []
    for under, suffixes in FRONTEND_TREES:
        base = root / under
        if base.is_dir():
            found.extend(walk_files(base, suffixes))
    return found


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for path in python_files(root) + frontend_files(root):
        try:
            count = len(path.read_text(encoding="utf-8").splitlines())
        except (OSError, UnicodeDecodeError):
            continue
        if count > MAX_LINES:
            findings.append(
                Finding(
                    scanner="length",
                    rule="length/file-length",
                    path=rel(root, path),
                    line=None,
                    message=(
                        f"{count} lines exceeds the {MAX_LINES}-line cap; "
                        "promote to a module split by intent"
                    ),
                )
            )
    return findings


SCANNER = Scanner(
    name="length",
    description="enforce the 800-line cap on Python and frontend files",
    run=scan,
)
