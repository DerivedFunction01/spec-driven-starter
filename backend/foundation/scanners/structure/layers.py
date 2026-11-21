"""Layer-boundary scanner (AST): the fundamentals import rule.

Production under ``backend/`` only. A module may import its own
tier or any tier below it; upward imports are findings. Tools
and tests are out of scope.
"""

from __future__ import annotations

import ast
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import python_files, rel

# Tier ranks: higher imports lower or its own tier, never upward.
# Intra-tier imports stay inside one layer: the scanner framework
# itself lives in foundation and imports its own base module.
RANKS = {
    "foundation": 0,
    "domain": 1,
    "infra": 2,
    "services": 3,
    "apps": 4,
}


def _imported_modules(
    tree: ast.Module, path_parts: tuple[str, ...]
) -> list[tuple[str, int]]:
    """(dotted module, lineno) for every import in a parsed file.

    Relative imports are resolved against the file's package.
    """
    out: list[tuple[str, int]] = []
    package_parts = list(path_parts[:-1])
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                out.append((alias.name, node.lineno))
        elif isinstance(node, ast.ImportFrom):
            if node.level and node.level > 0:
                climb = node.level - 1
                if climb > len(package_parts):
                    continue
                base = (
                    package_parts[: len(package_parts) - climb]
                    if climb
                    else package_parts
                )
                module = ".".join(
                    [*base, *(node.module.split(".") if node.module else [])]
                )
            else:
                module = node.module or ""
            if module:
                out.append((module, node.lineno))
    return out


def _scan_file(root: Path, path: Path) -> list[Finding]:
    parts = path.relative_to(root).parts
    if len(parts) < 3 or parts[1] not in RANKS:
        return []
    source_tier = parts[1]
    try:
        tree = ast.parse(path.read_text(encoding="utf-8"))
    except (OSError, SyntaxError, UnicodeDecodeError):
        return []
    findings: list[Finding] = []
    for module, line in _imported_modules(tree, parts):
        mod_parts = module.split(".")
        if mod_parts[0] != "backend" or len(mod_parts) < 2:
            continue  # stdlib / third-party: not the matrix's business
        target_tier = mod_parts[1]
        if target_tier not in RANKS:
            continue
        if RANKS[target_tier] > RANKS[source_tier]:
            findings.append(
                Finding(
                    scanner="layers",
                    rule="layers/import-ranks",
                    path=rel(root, path),
                    line=line,
                    message=(
                        f"'{source_tier}' may not import '{target_tier}' "
                        "(imports point downward only)"
                    ),
                )
            )
    return findings


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for path in python_files(root, "backend"):
        findings.extend(_scan_file(root, path))
    return findings


SCANNER = Scanner(
    name="layers",
    description="enforce downward-only imports across the backend tiers",
    run=scan,
)
