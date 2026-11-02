"""Literal scanner: credential-shaped and token-shaped strings.

Generic legs only: SSN shape, credential-shaped assignments
with a non-placeholder value, and GitHub-style token shapes.
The personal denylist is a separate scanner (``denylist.py``).
"""

from __future__ import annotations

import re
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import rel, walk_files

SCAN_SUFFIXES = (".py", ".md", ".toml", ".yaml", ".yml")

# The scanner mirror tests seed violating strings in fixture
# trees; their own source is not content under scan.
EXCLUDED_PREFIX = "tests/test_scanner_"

SSN_RE = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
CREDENTIAL_RE = re.compile(
    r"""(?i)\b(password|passwd|secret|token|api_key|apikey)\b"""
    r"""\s*=\s*["']([^"']+)["']"""
)
GITHUB_TOKEN_RE = re.compile(r"ghp_[A-Za-z0-9]{20,}")

PLACEHOLDER_MARKERS = (
    "example",
    "placeholder",
    "changeme",
    "change-me",
    "xxxx",
    "dummy",
    "sample",
    "test",
    "fake",
    "none",
    "null",
)


def _is_placeholder(value: str) -> bool:
    lowered = value.strip().lower()
    if len(lowered) < 4:
        return True
    if len(set(lowered)) == 1:
        return True
    return any(marker in lowered for marker in PLACEHOLDER_MARKERS)


def _read_lines(path: Path) -> list[str] | None:
    try:
        return path.read_text(encoding="utf-8").splitlines()
    except (OSError, UnicodeDecodeError):
        return None


def _scan_file(root: Path, path: Path) -> list[Finding]:
    relpath = rel(root, path)
    lines = _read_lines(path)
    if lines is None:
        return []
    findings: list[Finding] = []
    for lineno, line in enumerate(lines, start=1):
        if SSN_RE.search(line):
            findings.append(
                Finding(
                    scanner="literal",
                    rule="literal/ssn-shaped",
                    path=relpath,
                    line=lineno,
                    message="SSN-shaped string in tracked content",
                )
            )
        match = CREDENTIAL_RE.search(line)
        if match and not _is_placeholder(match.group(2)):
            findings.append(
                Finding(
                    scanner="literal",
                    rule="literal/credential-shaped",
                    path=relpath,
                    line=lineno,
                    message=(
                        "credential-shaped assignment with a non-placeholder "
                        "value (content withheld)"
                    ),
                )
            )
        if GITHUB_TOKEN_RE.search(line):
            findings.append(
                Finding(
                    scanner="literal",
                    rule="literal/token-shaped",
                    path=relpath,
                    line=lineno,
                    message="token-shaped string in tracked content",
                )
            )
    return findings


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for path in walk_files(root, SCAN_SUFFIXES):
        if rel(root, path).startswith(EXCLUDED_PREFIX):
            continue
        findings.extend(_scan_file(root, path))
    return findings


SCANNER = Scanner(
    name="literal",
    description="no SSN/credential/token-shaped literals in tracked content",
    run=scan,
)
