"""Portability scanner: tracked text resolves inside the repo.

No absolute or home-anchored paths and no references to
specific untracked plan files or dated memory logs; personal
literals are the denylist scanner's leg, never compiled here.
"""

from __future__ import annotations

import re
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import rel, walk_files

SCAN_SUFFIXES = (
    ".py",
    ".md",
    ".toml",
    ".yaml",
    ".yml",
    ".json",
    ".ts",
    ".tsx",
    ".js",
    ".mjs",
    ".sh",
    ".tmpl",
    ".txt",
)
EXTRA_FILES = (".gitignore",)

# The scanner mirror tests deliberately seed violating strings
# in fixture trees; their own source is not content under scan.
EXCLUDED_PREFIX = "tests/test_scanner_"

# Files that may declare portability-exception directives.
# Empty today: the tree needs none. Add a path here only
# together with the directive it relies on, in that file.
EXCEPTION_FILES: tuple[str, ...] = ()

_MARKER = "portability" + "-exception:"
EXCEPTION_DIRECTIVE_RE = re.compile(re.escape(_MARKER) + r"\s*(\S+)\s+—\s*(\S.*)$")

_BOUNDARY = r"(?<![\w/.-])"
_PATH_TAIL = r"[\w.-]+(?:/[\w.-]+)*"

ABS_HOME_RE = re.compile(_BOUNDARY + "/home/" + _PATH_TAIL)
ABS_USERS_RE = re.compile(_BOUNDARY + "/Users/" + _PATH_TAIL)
ABS_OPT_RE = re.compile(_BOUNDARY + "/opt/" + _PATH_TAIL)
ABS_TMP_RE = re.compile(_BOUNDARY + "/tmp/" + _PATH_TAIL)
DRIVE_RE = re.compile(
    r"(?<![\w])[A-Za-z]" + ":" + r"\\" + r"|(?<=[\s\"'(=])[A-Za-z]" + ":" + "/"
)
TILDE_RE = re.compile(_BOUNDARY + r"~/[\w.-][\w./-]*")

PLAN_FILE_RE = re.compile(
    r"\.plans/(?!finished/)[\w.-]+\.(?:md|json|ya?ml)"
    r"|\.plans/(?!finished/)[\w.-]+/"
    r"|\.plans/finished/[\w.-]+\.(?:md|json|ya?ml)"
)
DATED_MEMORY_RE = re.compile(_BOUNDARY + r"memory/\d{4}-\d{2}-\d{2}")

GENERIC_LEGS = (
    ("portability/abs-path", ABS_HOME_RE),
    ("portability/abs-path", ABS_USERS_RE),
    ("portability/abs-path", ABS_OPT_RE),
    ("portability/abs-path", ABS_TMP_RE),
    ("portability/abs-path", DRIVE_RE),
    ("portability/home-path", TILDE_RE),
    ("portability/untracked-ref", PLAN_FILE_RE),
    ("portability/untracked-ref", DATED_MEMORY_RE),
)


def scanned_files(root: Path) -> list[Path]:
    """The file set the text scanners share, sans mirror tests."""
    files = []
    for path in walk_files(root, SCAN_SUFFIXES):
        if rel(root, path).startswith(EXCLUDED_PREFIX):
            continue
        files.append(path)
    for name in EXTRA_FILES:
        extra = root / name
        if extra.is_file():
            files.append(extra)
    return files


def _read_lines(path: Path) -> list[str] | None:
    try:
        return path.read_text(encoding="utf-8").splitlines()
    except (OSError, UnicodeDecodeError):
        return None


def _declared_exceptions(relpath: str, lines: list[str]) -> set[str]:
    """Exact strings this file's directives exempt, if any.

    Only registry files may declare; a directive names one
    exact matched string and its reason, in that file only.
    """
    if relpath not in EXCEPTION_FILES:
        return set()
    found = set()
    for line in lines:
        match = EXCEPTION_DIRECTIVE_RE.search(line)
        if match:
            found.add(match.group(1))
    return found


def _scan_file(root: Path, path: Path) -> list[Finding]:
    relpath = rel(root, path)
    lines = _read_lines(path)
    if lines is None:
        return []
    exceptions = _declared_exceptions(relpath, lines)
    findings: list[Finding] = []
    for lineno, line in enumerate(lines, start=1):
        if relpath not in EXCEPTION_FILES and EXCEPTION_DIRECTIVE_RE.search(line):
            findings.append(
                Finding(
                    scanner="portability",
                    rule="portability/exception-misuse",
                    path=relpath,
                    line=lineno,
                    message="exception directive in a non-registry file",
                )
            )
        for rule, pattern in GENERIC_LEGS:
            for match in pattern.finditer(line):
                if match.group(0) in exceptions:
                    continue
                findings.append(
                    Finding(
                        scanner="portability",
                        rule=rule,
                        path=relpath,
                        line=lineno,
                        message="non-portable reference (content withheld)",
                    )
                )
    return findings


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for path in scanned_files(root):
        findings.extend(_scan_file(root, path))
    return findings


SCANNER = Scanner(
    name="portability",
    description="tracked text references only what a fresh clone resolves",
    run=scan,
)
