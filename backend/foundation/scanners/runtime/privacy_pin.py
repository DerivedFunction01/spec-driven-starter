"""Privacy-pin scanner: staff-only fields never cross the seam.

A services-layer dict key naming a staff-only field — an
``internal_`` or ``staff_`` prefix, or a pinned name — means a
private field is about to be served publicly.
"""

from __future__ import annotations

import ast
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import python_files, rel

PRIVATE_PREFIXES = ("internal_", "staff_")
PRIVATE_KEYS = frozenset({"internal_note", "staff_note", "private_note"})


def _private(key: str) -> bool:
    return key in PRIVATE_KEYS or key.startswith(PRIVATE_PREFIXES)


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for path in python_files(root, "backend/services"):
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeDecodeError, SyntaxError):
            continue
        for node in ast.walk(tree):
            if not isinstance(node, ast.Dict):
                continue
            for key in node.keys:
                if isinstance(key, ast.Constant) and isinstance(key.value, str):
                    if _private(key.value):
                        findings.append(
                            Finding(
                                scanner="privacy_pin",
                                rule="privacy-pin/staff-field-in-payload",
                                path=rel(root, path),
                                line=key.lineno,
                                message=(
                                    f"staff-only field '{key.value}' in a "
                                    "services payload; private fields never "
                                    "cross the API seam"
                                ),
                            )
                        )
    return findings


SCANNER = Scanner(
    name="privacy_pin",
    description="staff-only fields never appear in services payloads",
    run=scan,
)
