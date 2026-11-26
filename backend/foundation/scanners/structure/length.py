"""File-length scanner: cap and creep band against ``HEAD``.

Over the cap in ``MAX_LINES`` is an error; tracked files are
the population, and band growth past ``HEAD`` is an error.
"""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

from backend.foundation.scanners.base import (
    SEVERITY_ERROR,
    SEVERITY_NOTICE,
    Finding,
    Scanner,
)
from backend.foundation.scanners.files import CODE_SUFFIXES, rel, walk_files

MAX_LINES = 800
CREEP_LINES = 700


def _is_suite(path: Path) -> bool:
    """Whether ``path`` names a test suite (band-exempt)."""
    name = path.name
    return (
        name.startswith("test_")
        or path.stem.endswith("_test")
        or ".test." in name
        or ".spec." in name
    )


def _git(root: Path, *args: str) -> subprocess.CompletedProcess[str] | None:
    """Run git at ``root``; None when git cannot answer."""
    git = shutil.which("git")
    if git is None:
        return None
    try:
        result = subprocess.run(
            [git, *args],
            cwd=root,
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    return result if result.returncode == 0 else None


def _tracked_population(root: Path) -> dict[str, Path] | None:
    """Tracked code files by relative path, or None without git."""
    result = _git(root, "ls-files")
    if result is None:
        return None
    found: dict[str, Path] = {}
    for line in result.stdout.splitlines():
        relpath = line.strip()
        if relpath and Path(relpath).suffix in CODE_SUFFIXES:
            found[relpath] = root / relpath
    return found


def _population(root: Path) -> dict[str, Path]:
    """Scanned files by repo-relative path, tracked by default."""
    tracked = _tracked_population(root)
    if tracked is not None:
        return tracked
    return {rel(root, path): path for path in walk_files(root, CODE_SUFFIXES)}


def _head_count(root: Path, relpath: str) -> int | None:
    """Line count of ``relpath`` at HEAD, or None when absent."""
    result = _git(root, "show", f"HEAD:{relpath}")
    if result is None:
        return None
    return len(result.stdout.splitlines())


def _finding(rule: str, path: str, message: str, severity: str) -> Finding:
    """One length finding at ``path`` with the given severity."""
    return Finding(
        scanner="length",
        rule=rule,
        path=path,
        line=None,
        message=message,
        severity=severity,
    )


def _band_notice(relpath: str, count: int) -> Finding:
    """The notice listing for a file sitting in the creep band."""
    return _finding(
        "length/creep-band",
        relpath,
        f"{count} lines is in the creep band ({CREEP_LINES}-{MAX_LINES}); "
        "decompose along real seams before the cap forces it",
        SEVERITY_NOTICE,
    )


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for relpath, path in sorted(_population(root).items()):
        try:
            count = len(path.read_text(encoding="utf-8").splitlines())
        except (OSError, UnicodeDecodeError):
            continue
        if count > MAX_LINES:
            findings.append(
                _finding(
                    "length/file-length",
                    relpath,
                    f"{count} lines exceeds the {MAX_LINES}-line cap; "
                    "promote to a module split by intent",
                    SEVERITY_ERROR,
                )
            )
        elif count >= CREEP_LINES and not _is_suite(path):
            head = _head_count(root, relpath)
            if head is not None and count > head:
                findings.append(
                    _finding(
                        "length/band-growth",
                        relpath,
                        f"{count} lines, grown from {head} at HEAD while "
                        f"in the creep band ({CREEP_LINES}-{MAX_LINES}); "
                        "band files may not grow — decompose instead",
                        SEVERITY_ERROR,
                    )
                )
            else:
                findings.append(_band_notice(relpath, count))
    return findings


SCANNER = Scanner(
    name="length",
    description=(
        "enforce the line cap on tracked code files; the creep "
        "band lists as a notice and may not grow past HEAD"
    ),
    run=scan,
)
