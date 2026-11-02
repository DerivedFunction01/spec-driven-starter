"""Tests-tracked-only scanner (AST string scan over tests/).

A test string referencing a ``var/`` path or a ``frozen/``
snapshot is a finding: tests read tracked content only.
Exempt by explicit name: mirror tests that seed those strings.
"""

from __future__ import annotations

import ast
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import python_files, rel

EXEMPT_NAMES = frozenset(
    {
        "test_scanner_denylist.py",
        "test_scanner_tests_tracked_only.py",
        "test_scanner_tracking.py",
    }
)
FORBIDDEN_SUBSTRINGS = ("var/", "frozen/")


def _scan_file(root: Path, path: Path) -> list[Finding]:
    try:
        tree = ast.parse(path.read_text(encoding="utf-8"))
    except (OSError, SyntaxError, UnicodeDecodeError):
        return []
    findings: list[Finding] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            value = node.value
            if any(bad in value for bad in FORBIDDEN_SUBSTRINGS):
                findings.append(
                    Finding(
                        scanner="tests_tracked_only",
                        rule="tests_tracked_only/reference",
                        path=rel(root, path),
                        line=node.lineno,
                        message=(
                            "test references a var/ or frozen/ path; tests "
                            "read tracked fixtures and temp dirs only"
                        ),
                    )
                )
    return findings


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for path in python_files(root, "tests"):
        if path.name in EXEMPT_NAMES:
            continue
        findings.extend(_scan_file(root, path))
    return findings


SCANNER = Scanner(
    name="tests_tracked_only",
    description="tests reference no var/ or frozen/ paths (AST scan)",
    run=scan,
)
