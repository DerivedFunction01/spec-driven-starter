"""Folder-density scanner: the file cap in ``MAX_FILES``.

Counts direct-child code files per folder; over the cap is
a finding, the creep band lists as a notice, and registered
folders are frozen — growth or a stale entry is a finding.
"""

from __future__ import annotations

from collections import Counter
from pathlib import Path, PurePosixPath

from backend.foundation.scanners.base import (
    SEVERITY_ERROR,
    SEVERITY_NOTICE,
    Finding,
    Scanner,
)
from backend.foundation.scanners.files import rel, walk_files

MAX_FILES = 20
CREEP_FILES = 16

CODE_SUFFIXES: tuple[str, ...] = (".py", ".js", ".mjs", ".ts", ".tsx", ".css")
EXCLUDED_PARTS = frozenset({"assets", "generated"})

# The ratchet register: (folder, recorded count) for folders
# seeded over the band at adoption. An entry freezes its
# folder's count and must shrink away; it never excuses growth.
REGISTER: tuple[tuple[str, int], ...] = (
    ("backend/foundation/scanners", 30),
    ("tests", 44),
    ("workhorse-kit/components", 29),
)


def _in_population(parts: tuple[str, ...]) -> bool:
    """Whether a file's relative parts belong to the population."""
    if any(part in EXCLUDED_PARTS for part in parts):
        return False
    return not (parts[0] == "flavors" and "files" in parts[1:3])


def folder_counts(root: Path) -> dict[str, int]:
    """Direct-child code-file counts per folder under ``root``."""
    counts: Counter[str] = Counter()
    for path in walk_files(root, CODE_SUFFIXES):
        if not _in_population(path.relative_to(root).parts):
            continue
        folder = PurePosixPath(rel(root, path)).parent.as_posix()
        counts[folder] += 1
    return dict(counts)


def _finding(folder: str, rule: str, message: str, notice: bool = False) -> Finding:
    return Finding(
        scanner="folder_density",
        rule=rule,
        path=folder,
        line=None,
        message=message,
        severity=SEVERITY_NOTICE if notice else SEVERITY_ERROR,
    )


def _unregistered(folder: str, count: int) -> list[Finding]:
    if count > MAX_FILES:
        return [
            _finding(
                folder,
                "folder_density/folder-density",
                f"{count} code files exceeds the {MAX_FILES}-file folder "
                "cap; group into subfolders by intent",
            )
        ]
    if count > CREEP_FILES:
        return [
            _finding(
                folder,
                "folder_density/creep-band",
                f"{count} code files, inside the creep band over "
                f"{CREEP_FILES}; group into subfolders by intent "
                "before the cap forces it",
                notice=True,
            )
        ]
    return []


def _registered(folder: str, count: int, recorded: int) -> list[Finding]:
    if count > recorded:
        return [
            _finding(
                folder,
                "folder_density/register-growth",
                f"registered folder grew from {recorded} to {count} code "
                "files; the register freezes growth — group into "
                "subfolders by intent",
            )
        ]
    if count <= CREEP_FILES:
        return [
            _finding(
                folder,
                "folder_density/register-stale",
                f"registered folder is down to {count} code files, at or "
                "below the creep floor; remove the register entry",
            )
        ]
    if count < recorded:
        return [
            _finding(
                folder,
                "folder_density/register-stale",
                f"register records {recorded} code files but the folder "
                f"holds {count}; update the recorded count down",
            )
        ]
    if count > MAX_FILES:
        return [
            _finding(
                folder,
                "folder_density/registered-over-cap",
                f"registered folder holds {count} code files, over the "
                f"{MAX_FILES}-file cap; its decomposition is queued "
                "in the register",
                notice=True,
            )
        ]
    return [
        _finding(
            folder,
            "folder_density/creep-band",
            f"registered folder holds {count} code files, inside the "
            f"creep band over {CREEP_FILES}; its decomposition is "
            "queued in the register",
            notice=True,
        )
    ]


def scan(root: Path) -> list[Finding]:
    counts = folder_counts(root)
    registered = dict(REGISTER)
    findings: list[Finding] = []
    for folder in sorted(counts):
        recorded = registered.get(folder)
        if recorded is None:
            findings.extend(_unregistered(folder, counts[folder]))
        else:
            findings.extend(_registered(folder, counts[folder], recorded))
    for folder in sorted(registered):
        if folder not in counts:
            findings.append(
                _finding(
                    folder,
                    "folder_density/register-stale",
                    "registered folder no longer exists in the counted "
                    "population; remove the register entry",
                )
            )
    return findings


SCANNER = Scanner(
    name="folder_density",
    description="enforce the per-folder code-file cap and creep band",
    run=scan,
)
