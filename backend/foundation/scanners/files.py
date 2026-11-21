"""File discovery shared by the scanners.

Walks the working tree from a root, skipping what is never
source: ``var/``, ``.git/``, ``workbench/``, caches, and the
untracked plan files under ``.plans/``; the tracked form
filters a walk to ``git ls-files`` when git answers.
"""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

SKIP_DIRS = frozenset(
    {".git", ".plans", "__pycache__", "node_modules", "var", "workbench", ".venv"}
)


def walk_files(root: Path, suffixes: tuple[str, ...]) -> list[Path]:
    """All files under ``root`` with one of ``suffixes``, sorted."""
    found: list[Path] = []
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.suffix not in suffixes:
            continue
        rel_parts = path.relative_to(root).parts
        if any(part in SKIP_DIRS for part in rel_parts[:-1]):
            continue
        found.append(path)
    return found


def tracked_paths(root: Path) -> set[str] | None:
    """Tracked repo-relative POSIX paths, or None when git cannot answer."""
    git = shutil.which("git")
    if git is None:
        return None
    try:
        result = subprocess.run(
            [git, "ls-files"],
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
    return {line.strip() for line in result.stdout.splitlines() if line.strip()}


def walk_tracked(root: Path, suffixes: tuple[str, ...]) -> list[Path]:
    """Walked files in the tracked set when git answers, else the walk."""
    tracked = tracked_paths(root)
    walked = walk_files(root, suffixes)
    if tracked is None:
        return walked
    return [path for path in walked if rel(root, path) in tracked]


def python_files(root: Path, under: str | None = None) -> list[Path]:
    """Python files under ``root`` (optionally restricted to a subtree)."""
    base = root / under if under else root
    if not base.is_dir():
        return []
    return walk_files(base, (".py",))


def rel(root: Path, path: Path) -> str:
    """Root-relative POSIX path for reporting."""
    return path.relative_to(root).as_posix()
