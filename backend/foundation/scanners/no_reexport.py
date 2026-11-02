"""No-reexport scanner: ``__init__.py`` carries no imports.

A package ``__init__.py`` may contain only a docstring, comments,
or nothing; any import in one under ``backend/`` is a finding.
The registry lives in ``registry.py``; this rule has no exceptions.
"""

from __future__ import annotations

import ast
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import python_files, rel


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for path in python_files(root, "backend"):
        if path.name != "__init__.py":
            continue
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"))
        except (OSError, SyntaxError, UnicodeDecodeError):
            continue
        for node in ast.walk(tree):
            if isinstance(node, (ast.Import, ast.ImportFrom)):
                findings.append(
                    Finding(
                        scanner="no_reexport",
                        rule="no_reexport/init-import",
                        path=rel(root, path),
                        line=node.lineno,
                        message=(
                            "__init__.py must not import; consumers "
                            "import from the leaf module"
                        ),
                    )
                )
    return findings


SCANNER = Scanner(
    name="no_reexport",
    description="__init__.py files under backend/ contain no imports",
    run=scan,
)
