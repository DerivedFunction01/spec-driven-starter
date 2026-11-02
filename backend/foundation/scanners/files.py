"""File discovery shared by the scanners.

Walks the working tree from a root, skipping what is never
source: ``var/``, ``.git/``, ``workbench/``, caches, and the
untracked plan files under ``.plans/``.
"""

from __future__ import annotations

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


def python_files(root: Path, under: str | None = None) -> list[Path]:
    """Python files under ``root`` (optionally restricted to a subtree)."""
    base = root / under if under else root
    if not base.is_dir():
        return []
    return walk_files(base, (".py",))


def rel(root: Path, path: Path) -> str:
    """Root-relative POSIX path for reporting."""
    return path.relative_to(root).as_posix()
