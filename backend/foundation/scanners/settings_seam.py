"""Settings-seam scanner (AST): one environment reader only.

Production under ``backend/`` must not touch the process
environment or dotenv outside ``foundation/settings.py``.
Named exemption: ``scanners/denylist.py``, the harness's seam.
"""

from __future__ import annotations

import ast
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import python_files, rel

SETTINGS_PATH = "backend/foundation/settings.py"
EXEMPT_PATHS = frozenset({SETTINGS_PATH, "backend/foundation/scanners/denylist.py"})

ENV_ATTRS = frozenset({"environ", "getenv", "putenv", "unsetenv"})
ENV_NAMES = frozenset({"environ", "getenv", "putenv", "unsetenv"})


def _scan_file(root: Path, path: Path) -> list[Finding]:
    try:
        tree = ast.parse(path.read_text(encoding="utf-8"))
    except (OSError, SyntaxError, UnicodeDecodeError):
        return []
    findings: list[Finding] = []

    def flag(line: int, message: str) -> None:
        findings.append(
            Finding(
                scanner="settings_seam",
                rule="settings_seam/env-access",
                path=rel(root, path),
                line=line,
                message=message,
            )
        )

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name == "dotenv" or alias.name.startswith("dotenv."):
                    flag(node.lineno, "dotenv import outside the settings seam")
        elif isinstance(node, ast.ImportFrom):
            if node.module == "dotenv":
                flag(node.lineno, "dotenv import outside the settings seam")
            elif node.module == "os":
                for alias in node.names:
                    if alias.name in ENV_NAMES:
                        flag(
                            node.lineno,
                            f"'from os import {alias.name}' bypasses the seam",
                        )
        elif isinstance(node, ast.Attribute):
            if (
                node.attr in ENV_ATTRS
                and isinstance(node.value, ast.Name)
                and node.value.id == "os"
            ):
                flag(
                    node.lineno,
                    f"os.{node.attr} outside the foundation settings seam",
                )
    return findings


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for path in python_files(root, "backend"):
        if rel(root, path) in EXEMPT_PATHS:
            continue
        findings.extend(_scan_file(root, path))
    return findings


SCANNER = Scanner(
    name="settings_seam",
    description="no environment access outside foundation/settings.py (AST)",
    run=scan,
)
