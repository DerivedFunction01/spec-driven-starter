"""Legacy-shims scanner: backward-compatibility wording is banned.

Phrases are scanned in code and comments alike, plus banned
parts in identifiers and class names, plus bare CamelCase alias
bindings. Scanner infrastructure is exempt by design.
"""

from __future__ import annotations

import ast
import re
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import python_files, rel

INFRA_PREFIXES = ("backend/foundation/scanners/",)
EXEMPT_PATHS = frozenset({"tests/test_scanner_legacy_shims.py"})

PHRASE_RE = re.compile(
    r"\b(?:backwards?[-_ ]compat\w*"
    r"|deprecat\w*"
    r"|legacy"
    r"|transitional[-_ ]shim\w*"
    r"|compat(?:ibility)?[-_ ]shim\w*"
    r"|kept for (?:backward[-_ ])?compat\w*)\b",
    re.IGNORECASE,
)
IDENTIFIER_RE = re.compile(r"legacy|compat|shim", re.IGNORECASE)
CLASS_NAME_RE = re.compile(r"Legacy|Compat|Shim|Deprecated")
CAMEL_RE = re.compile(r"^[A-Z][A-Za-z0-9]*$")

_HINT = "there are no shims: move the call sites in the same change"


def _phrase_findings(relpath: str, source_lines: list[str]) -> list[Finding]:
    findings: list[Finding] = []
    for lineno, line in enumerate(source_lines, start=1):
        if PHRASE_RE.search(line):
            findings.append(
                Finding(
                    scanner="legacy_shims",
                    rule="legacy_shims/phrase",
                    path=relpath,
                    line=lineno,
                    message=f"banned compatibility wording; {_HINT}",
                )
            )
    return findings


def _name_findings(relpath: str, tree: ast.Module) -> list[Finding]:
    findings: list[Finding] = []

    def flag(line: int, rule: str, message: str) -> None:
        findings.append(
            Finding(
                scanner="legacy_shims",
                rule=rule,
                path=relpath,
                line=line,
                message=message,
            )
        )

    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            if CLASS_NAME_RE.search(node.name) or IDENTIFIER_RE.search(node.name):
                flag(
                    node.lineno,
                    "legacy_shims/class-name",
                    f"class name '{node.name}' carries a banned part; {_HINT}",
                )
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            if IDENTIFIER_RE.search(node.name):
                flag(
                    node.lineno,
                    "legacy_shims/identifier",
                    f"identifier '{node.name}' carries a banned part; {_HINT}",
                )
        elif isinstance(node, ast.arg):
            if IDENTIFIER_RE.search(node.arg):
                flag(
                    node.lineno,
                    "legacy_shims/identifier",
                    f"identifier '{node.arg}' carries a banned part; {_HINT}",
                )
        elif isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store):
            if IDENTIFIER_RE.search(node.id):
                flag(
                    node.lineno,
                    "legacy_shims/identifier",
                    f"identifier '{node.id}' carries a banned part; {_HINT}",
                )
        elif isinstance(node, ast.Assign):
            if (
                len(node.targets) == 1
                and isinstance(node.targets[0], ast.Name)
                and CAMEL_RE.match(node.targets[0].id)
                and isinstance(node.value, ast.Name)
                and CAMEL_RE.match(node.value.id)
            ):
                flag(
                    node.lineno,
                    "legacy_shims/alias",
                    f"bare alias binding '{node.targets[0].id} = "
                    f"{node.value.id}'; import from the leaf module",
                )
    return findings


def _scan_file(root: Path, path: Path) -> list[Finding]:
    relpath = rel(root, path)
    if relpath.startswith(INFRA_PREFIXES) or relpath in EXEMPT_PATHS:
        return []
    try:
        source = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return []
    findings = _phrase_findings(relpath, source.splitlines())
    try:
        tree = ast.parse(source)
    except SyntaxError:
        return findings
    findings.extend(_name_findings(relpath, tree))
    return findings


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for path in python_files(root):
        findings.extend(_scan_file(root, path))
    return findings


SCANNER = Scanner(
    name="legacy_shims",
    description="no compatibility wording, identifiers, or alias bindings",
    run=scan,
)
