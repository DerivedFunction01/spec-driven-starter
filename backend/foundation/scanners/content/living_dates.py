"""Living-dates scanner: no dates in living docs or comments.

Living documents state the present truth and carry no dates;
code comments and docstrings carry no dates either. Dates as
data — string literals, fixtures, specimens, served values —
are not documents or comments and pass. Archives are records:
finished plans and run-log or dated-log directories are
excluded by directory convention only, never by a register
of exempt files. The population is the tracked tree, derived
from ``git ls-files`` when git answers.
"""

from __future__ import annotations

import ast
import io
import re
import tokenize
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import rel, tracked_paths, walk_files

DOC_SUFFIXES = (".md",)
PYTHON_SUFFIXES = (".py",)
SCRIPT_SUFFIXES = (".ts", ".tsx", ".js", ".jsx", ".mjs")
SCAN_SUFFIXES = DOC_SUFFIXES + PYTHON_SUFFIXES + SCRIPT_SUFFIXES

# The scanner mirror tests deliberately seed violating strings
# in fixture trees; their own source is not content under scan.
EXCLUDED_PREFIX = "tests/scanners/"

# Archive directory conventions: a path under a finished-plan
# directory, a run-log directory, or a dated-log directory is
# a record, not a living document. A directory named by a
# date is a dated log by its name alone.
ARCHIVE_DIR_NAMES = frozenset(
    {"run-log", "run-logs", "run_log", "run_logs", "dated-logs", "dated_logs"}
)
DATE_DIR_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

_MONTH = (
    r"(?:January|February|March|April|May|June|July|August|"
    r"September|October|November|December|"
    r"Jan\.?|Feb\.?|Mar\.?|Apr\.?|Jun\.?|Jul\.?|Aug\.?|"
    r"Sep\.?|Sept\.?|Oct\.?|Nov\.?|Dec\.?)"
)
ISO_DATE_RE = re.compile(r"\b\d{4}-\d{2}-\d{2}\b")
SLASH_DATE_RE = re.compile(r"\b\d{4}/\d{2}/\d{2}\b")
MONTH_DAY_YEAR_RE = re.compile(
    r"\b" + _MONTH + r"\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b"
)
DAY_MONTH_YEAR_RE = re.compile(
    r"\b\d{1,2}(?:st|nd|rd|th)?\s+" + _MONTH + r"\s+\d{4}\b"
)
MONTH_YEAR_RE = re.compile(r"\b" + _MONTH + r"\s+\d{4}\b")
PAREN_YEAR_RE = re.compile(r"\(\s*(?:19|20)\d{2}\s*\)")

DATE_LEGS = (
    ("living-dates/iso-date", ISO_DATE_RE),
    ("living-dates/iso-date", SLASH_DATE_RE),
    ("living-dates/month-date", MONTH_DAY_YEAR_RE),
    ("living-dates/month-date", DAY_MONTH_YEAR_RE),
    ("living-dates/month-date", MONTH_YEAR_RE),
    ("living-dates/date-parenthetical", PAREN_YEAR_RE),
)


def _is_archive(relpath: str) -> bool:
    parts = Path(relpath).parts
    dirs = parts[:-1]
    for index, part in enumerate(dirs):
        if part in ARCHIVE_DIR_NAMES or DATE_DIR_RE.match(part):
            return True
        if part == ".plans" and index + 1 < len(dirs):
            if dirs[index + 1] == "finished":
                return True
    return False


def population(root: Path) -> list[Path]:
    """Tracked living docs and code files, archives excluded."""
    tracked = tracked_paths(root)
    if tracked is not None:
        candidates = [root / name for name in sorted(tracked)]
    else:
        candidates = walk_files(root, SCAN_SUFFIXES)
    files: list[Path] = []
    for path in candidates:
        if path.suffix not in SCAN_SUFFIXES or not path.is_file():
            continue
        relpath = rel(root, path)
        if relpath.startswith(EXCLUDED_PREFIX) or _is_archive(relpath):
            continue
        files.append(path)
    return files


def _date_findings(scanner_path: str, lineno: int, text: str) -> list[Finding]:
    findings: list[Finding] = []
    for rule, pattern in DATE_LEGS:
        if pattern.search(text):
            findings.append(
                Finding(
                    scanner="living_dates",
                    rule=rule,
                    path=scanner_path,
                    line=lineno,
                    message="date in a living document or comment (content withheld)",
                )
            )
    return findings


def _read_text(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return None


def _scan_doc(root: Path, path: Path, text: str) -> list[Finding]:
    relpath = rel(root, path)
    findings: list[Finding] = []
    for lineno, line in enumerate(text.splitlines(), start=1):
        findings.extend(_date_findings(relpath, lineno, line))
    return findings


def _python_surfaces(text: str) -> list[tuple[int, str]]:
    """(line, text) pairs for comments and docstring lines."""
    surfaces: list[tuple[int, str]] = []
    try:
        tokens = tokenize.generate_tokens(io.StringIO(text).readline)
        for token in tokens:
            if token.type == tokenize.COMMENT:
                surfaces.append((token.start[0], token.string))
    except (tokenize.TokenError, IndentationError, SyntaxError):
        pass
    try:
        tree = ast.parse(text)
    except SyntaxError:
        return surfaces
    for node in ast.walk(tree):
        if not isinstance(
            node, (ast.Module, ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)
        ):
            continue
        if not node.body or not isinstance(node.body[0], ast.Expr):
            continue
        value = node.body[0].value
        if not (isinstance(value, ast.Constant) and isinstance(value.value, str)):
            continue
        first = value.lineno
        last = value.end_lineno or first
        lines = text.splitlines()
        for lineno in range(first, last + 1):
            surfaces.append((lineno, lines[lineno - 1]))
    return surfaces


def _script_surfaces(text: str) -> list[tuple[int, str]]:
    """(line, text) pairs for TS/JS comments, lexed by hand.

    Strings and template literals are skipped so a date held
    as data never reads as a comment. Regex literals are not
    distinguished from division; a date inside a regex reads
    as comment text — the conservative direction.
    """
    surfaces: list[tuple[int, str]] = []
    index = 0
    lineno = 1
    length = len(text)
    while index < length:
        char = text[index]
        nxt = text[index + 1] if index + 1 < length else ""
        if char == "\n":
            lineno += 1
            index += 1
        elif char == "/" and nxt == "/":
            end = text.find("\n", index)
            if end == -1:
                end = length
            surfaces.append((lineno, text[index:end]))
            index = end
        elif char == "/" and nxt == "*":
            end = text.find("*/", index + 2)
            if end == -1:
                end = length - 2
            segment = text[index : end + 2]
            for offset, line in enumerate(segment.splitlines()):
                surfaces.append((lineno + offset, line))
            lineno += segment.count("\n")
            index = end + 2
        elif char in "'\"`":
            quote = char
            index += 1
            while index < length:
                if text[index] == "\\":
                    index += 2
                    continue
                if text[index] == "\n":
                    lineno += 1
                if text[index] == quote:
                    index += 1
                    break
                index += 1
        else:
            index += 1
    return surfaces


def _scan_code(root: Path, path: Path, text: str) -> list[Finding]:
    relpath = rel(root, path)
    if path.suffix in PYTHON_SUFFIXES:
        surfaces = _python_surfaces(text)
    else:
        surfaces = _script_surfaces(text)
    findings: list[Finding] = []
    for lineno, surface in surfaces:
        findings.extend(_date_findings(relpath, lineno, surface))
    return findings


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for path in population(root):
        text = _read_text(path)
        if text is None:
            continue
        if path.suffix in DOC_SUFFIXES:
            findings.extend(_scan_doc(root, path, text))
        else:
            findings.extend(_scan_code(root, path, text))
    return findings


SCANNER = Scanner(
    name="living_dates",
    description="living documents and code comments carry no dates",
    run=scan,
)
