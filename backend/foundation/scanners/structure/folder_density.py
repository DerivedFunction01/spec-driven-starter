"""Folder-density scanner: the file cap in ``MAX_FILES``.

Counts every tracked file of any kind, direct children per
folder; over the cap is a finding, and the creep band lists
as a notice with additions over the ``HEAD`` count an error.
"""

from __future__ import annotations

import shutil
import subprocess
from collections import Counter
from pathlib import Path, PurePosixPath

from backend.foundation.scanners.base import (
    SEVERITY_ERROR,
    SEVERITY_NOTICE,
    Finding,
    Scanner,
)
from backend.foundation.scanners.files import SKIP_DIRS

MAX_FILES = 20
CREEP_FILES = 16


def _git_lines(root: Path, args: list[str]) -> list[str] | None:
    """Lines of a git command at ``root``, or None if git cannot answer."""
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
    if result.returncode != 0:
        return None
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def _walked_paths(root: Path) -> list[str]:
    """Every file under ``root`` as a relative POSIX path, skips applied."""
    found: list[str] = []
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        parts = path.relative_to(root).parts
        if any(part in SKIP_DIRS for part in parts[:-1]):
            continue
        found.append(PurePosixPath(*parts).as_posix())
    return found


def _counts(paths: list[str]) -> dict[str, int]:
    counts: Counter[str] = Counter()
    for path in paths:
        counts[PurePosixPath(path).parent.as_posix()] += 1
    return dict(counts)


def folder_counts(root: Path) -> dict[str, int]:
    """Direct-child tracked-file counts per folder under ``root``."""
    tracked = _git_lines(root, ["ls-files"])
    if tracked is None:
        tracked = _walked_paths(root)
    return _counts(tracked)


def _head_counts(root: Path) -> dict[str, int] | None:
    lines = _git_lines(root, ["ls-tree", "-r", "--name-only", "HEAD"])
    if lines is None:
        return None
    return _counts(lines)


def _finding(folder: str, rule: str, message: str, notice: bool = False) -> Finding:
    return Finding(
        scanner="folder_density",
        rule=rule,
        path=folder,
        line=None,
        message=message,
        severity=SEVERITY_NOTICE if notice else SEVERITY_ERROR,
    )


def _band(folder: str, count: int, head: dict[str, int] | None) -> Finding:
    if head is not None and folder in head and count > head[folder]:
        return _finding(
            folder,
            "folder_density/band-addition",
            f"band folder grew from {head[folder]} files at HEAD to "
            f"{count}; additions are banned in the creep band — "
            "group into subfolders by intent",
        )
    return _finding(
        folder,
        "folder_density/creep-band",
        f"{count} files, inside the creep band over {CREEP_FILES}; "
        "group into subfolders by intent before the cap forces it",
        notice=True,
    )


def scan(root: Path) -> list[Finding]:
    counts = folder_counts(root)
    head = _head_counts(root)
    findings: list[Finding] = []
    for folder in sorted(counts):
        count = counts[folder]
        if count > MAX_FILES:
            findings.append(
                _finding(
                    folder,
                    "folder_density/folder-density",
                    f"{count} files exceeds the {MAX_FILES}-file folder "
                    "cap; group into subfolders by intent",
                )
            )
        elif count > CREEP_FILES:
            findings.append(_band(folder, count, head))
    return findings


SCANNER = Scanner(
    name="folder_density",
    description="enforce the per-folder tracked-file cap and creep band",
    run=scan,
)
