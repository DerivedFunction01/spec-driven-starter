"""Prose-length scanner: docstring and comment caps.

Module docstrings cap at 4 prose lines, function/class at 3,
comment blocks at 3 (tests: 3/2/2); a trailing comment counts
alone. EXEMPT records path -> reason for CLI-text docstrings.
"""

from __future__ import annotations

import ast
import io
import tokenize
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import python_files, rel

MODULE_CAP = 4
DEF_CAP = 3
COMMENT_CAP = 3
TEST_MODULE_CAP = 3
TEST_DEF_CAP = 2
TEST_COMMENT_CAP = 2

# path -> reason its module docstring is exempt from the cap.
EXEMPT: dict[str, str] = {
    "check.py": "module docstring is the gate's --help text",
    "tools/apply_flavor.py": "module docstring is the CLI usage text",
}

TEST_PREFIX = "tests/"


def _is_test(relpath: str) -> bool:
    return relpath.startswith(TEST_PREFIX)


def _content_lines(source_lines: list[str], start: int, end: int) -> int:
    span = source_lines[start - 1 : end]
    if len(span) == 1:
        return 1 if span[0].strip().strip('"').strip("'").strip() else 0
    total = 0
    for text in span:
        stripped = text.strip()
        if not stripped:
            continue
        if stripped in {'"""', "'''"}:
            continue
        if stripped.startswith(('"""', "'''")) and stripped.endswith(('"""', "'''")):
            continue
        total += 1
    return total


def _docstring_findings(
    relpath: str, tree: ast.Module, source_lines: list[str]
) -> list[Finding]:
    test = _is_test(relpath)
    module_cap = TEST_MODULE_CAP if test else MODULE_CAP
    def_cap = TEST_DEF_CAP if test else DEF_CAP
    findings: list[Finding] = []
    for node in ast.walk(tree):
        if not isinstance(
            node, (ast.Module, ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)
        ):
            continue
        body = getattr(node, "body", None)
        if not body:
            continue
        first = body[0]
        if not (
            isinstance(first, ast.Expr)
            and isinstance(first.value, ast.Constant)
            and isinstance(first.value.value, str)
        ):
            continue
        is_module = isinstance(node, ast.Module)
        if is_module and relpath in EXEMPT:
            continue
        start = first.lineno
        end = first.end_lineno or first.lineno
        count = _content_lines(source_lines, start, end)
        cap = module_cap if is_module else def_cap
        if count <= cap:
            continue
        findings.append(
            Finding(
                scanner="prose_length",
                rule=(
                    "prose_length/module-docstring"
                    if is_module
                    else "prose_length/def-docstring"
                ),
                path=relpath,
                line=start,
                message=(
                    f"docstring is {count} prose lines (cap {cap}); "
                    "keep the conclusion, drop the derivation"
                ),
            )
        )
    return findings


def _comment_runs(source: str, source_lines: list[str]) -> list[tuple[int, int]]:
    standalone: list[int] = []
    try:
        tokens = tokenize.generate_tokens(io.StringIO(source).readline)
        for token in tokens:
            if token.type != tokenize.COMMENT:
                continue
            row, col = token.start
            if source_lines[row - 1][:col].strip():
                continue  # trailing comment: counts alone, never joins
            standalone.append(row)
    except (tokenize.TokenError, IndentationError, SyntaxError):
        return []
    runs: list[tuple[int, int]] = []
    for line in standalone:
        if runs and line == runs[-1][0] + runs[-1][1]:
            first, count = runs[-1]
            runs[-1] = (first, count + 1)
        else:
            runs.append((line, 1))
    return runs


def _scan_file(root: Path, path: Path) -> list[Finding]:
    relpath = rel(root, path)
    try:
        source = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return []
    source_lines = source.splitlines()
    findings: list[Finding] = []
    try:
        tree = ast.parse(source)
    except SyntaxError:
        tree = None
    if tree is not None:
        findings.extend(_docstring_findings(relpath, tree, source_lines))
    cap = TEST_COMMENT_CAP if _is_test(relpath) else COMMENT_CAP
    for line, count in _comment_runs(source, source_lines):
        if count > cap:
            findings.append(
                Finding(
                    scanner="prose_length",
                    rule="prose_length/comment-block",
                    path=relpath,
                    line=line,
                    message=(
                        f"comment block is {count} lines (cap {cap}); "
                        "keep the constraint, delete the narration"
                    ),
                )
            )
    return findings


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for path in python_files(root):
        findings.extend(_scan_file(root, path))
    return findings


SCANNER = Scanner(
    name="prose_length",
    description="docstring and comment length caps (prose discipline)",
    run=scan,
)
