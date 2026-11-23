"""Living-dates scanner: no dates in living docs or comments.

Living documents state the present truth and carry no dates;
code comments and docstrings carry no dates either. Dates as
data — string literals, fixtures, specimens, served values —
are not documents or comments and pass. Code inside a
document — fenced blocks and inline code spans — is data in
the same way: it is the doc form of a string literal, never
a finding. Comments in config files are comments: the hash
comment family (a ``.gitignore`` file, TOML, YAML, CFG, INI)
is in the population, its values never a surface. Archives
are records: finished plans and run-log or dated-log
directories are excluded by directory convention only,
never by a register of exempt files. The population is the
tracked tree, derived from ``git ls-files`` when git
answers.
"""

from __future__ import annotations

import ast
import io
import re
import tokenize
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import SKIP_DIRS, rel, tracked_paths, walk_files

DOC_SUFFIXES = (".md",)
PYTHON_SUFFIXES = (".py",)
SCRIPT_SUFFIXES = (".ts", ".tsx", ".js", ".jsx", ".mjs")
SCAN_SUFFIXES = DOC_SUFFIXES + PYTHON_SUFFIXES + SCRIPT_SUFFIXES
CONFIG_SUFFIXES = (".toml", ".yaml", ".yml", ".cfg", ".ini")
CONFIG_NAMES = frozenset({".gitignore"})
ALL_SUFFIXES = SCAN_SUFFIXES + CONFIG_SUFFIXES

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


def _in_population(path: Path) -> bool:
    return path.suffix in ALL_SUFFIXES or path.name in CONFIG_NAMES


def _walk_named(root: Path) -> list[Path]:
    """Walk-mode candidates for the name-ruled config files."""
    found: list[Path] = []
    for name in sorted(CONFIG_NAMES):
        for path in sorted(root.rglob(name)):
            if not path.is_file():
                continue
            parts = path.relative_to(root).parts
            if any(part in SKIP_DIRS for part in parts[:-1]):
                continue
            found.append(path)
    return found


def population(root: Path) -> list[Path]:
    """Tracked living docs and code files, archives excluded."""
    tracked = tracked_paths(root)
    if tracked is not None:
        candidates = [root / name for name in sorted(tracked)]
    else:
        candidates = walk_files(root, ALL_SUFFIXES) + _walk_named(root)
    files: list[Path] = []
    for path in candidates:
        if not _in_population(path) or not path.is_file():
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


def _find_span_close(line: str, start: int, run: int) -> int | None:
    """End index of the backtick run of exactly ``run`` closing a span."""
    index = start
    length = len(line)
    while index < length:
        if line[index] != "`":
            index += 1
            continue
        run_end = index
        while run_end < length and line[run_end] == "`":
            run_end += 1
        if run_end - index == run:
            return run_end
        index = run_end
    return None


def _mask_code_spans(line: str) -> str:
    """The line with inline code spans blanked to spaces.

    A span opens with a run of backticks and closes with a
    run of the same length; an unmatched run is literal
    text and stays. Length is preserved, so columns and
    line numbers hold.
    """
    chars = list(line)
    index = 0
    length = len(line)
    while index < length:
        if line[index] != "`":
            index += 1
            continue
        run_end = index
        while run_end < length and line[run_end] == "`":
            run_end += 1
        close = _find_span_close(line, run_end, run_end - index)
        if close is None:
            index = run_end
            continue
        for position in range(index, close):
            chars[position] = " "
        index = close
    return "".join(chars)


def _mask_doc_lines(text: str) -> list[str]:
    """Doc lines with fenced blocks and code spans blanked.

    Code inside a document is data — the doc form of a
    string literal — so fenced blocks (backtick or tilde)
    and inline code spans are blanked in place; prose on
    the same lines still scans, and line numbers hold.
    """
    masked: list[str] = []
    fence_char = ""
    for line in text.splitlines():
        stripped = line.lstrip()
        if fence_char:
            masked.append("")
            if stripped.startswith(fence_char * 3):
                fence_char = ""
            continue
        if stripped.startswith("```") or stripped.startswith("~~~"):
            fence_char = stripped[0]
            masked.append("")
            continue
        masked.append(_mask_code_spans(line))
    return masked


def _scan_doc(root: Path, path: Path, text: str) -> list[Finding]:
    relpath = rel(root, path)
    findings: list[Finding] = []
    for lineno, line in enumerate(_mask_doc_lines(text), start=1):
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


def _hash_comment_surfaces(text: str) -> list[tuple[int, str]]:
    """(line, comment) pairs for hash-comment config files.

    A comment runs from an unquoted ``#`` to the end of the
    line. Quoted strings are data — a ``#`` inside one starts
    no comment — so the scan skips them with the same
    quote discipline as the script lexer; values are never
    a surface.
    """
    surfaces: list[tuple[int, str]] = []
    for lineno, line in enumerate(text.splitlines(), start=1):
        quote = ""
        index = 0
        while index < len(line):
            char = line[index]
            if quote:
                if char == "\\" and quote == '"':
                    index += 2
                    continue
                if char == quote:
                    if quote == "'" and line[index + 1 : index + 2] == "'":
                        index += 2
                        continue
                    quote = ""
                index += 1
                continue
            if char in "'\"":
                quote = char
                index += 1
                continue
            if char == "#":
                surfaces.append((lineno, line[index:]))
                break
            index += 1
    return surfaces


def _scan_config(root: Path, path: Path, text: str) -> list[Finding]:
    relpath = rel(root, path)
    if path.name in CONFIG_NAMES:
        # Gitignore syntax: a comment is a line whose first
        # character is a hash; a hash later in a line is
        # pattern content, not a comment.
        surfaces = [
            (lineno, line)
            for lineno, line in enumerate(text.splitlines(), start=1)
            if line.startswith("#")
        ]
    else:
        surfaces = _hash_comment_surfaces(text)
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
        elif path.name in CONFIG_NAMES or path.suffix in CONFIG_SUFFIXES:
            findings.extend(_scan_config(root, path, text))
        else:
            findings.extend(_scan_code(root, path, text))
    return findings


SCANNER = Scanner(
    name="living_dates",
    description="living documents and code comments carry no dates",
    run=scan,
)
