"""File-length scanner: cap, creep band, and register.

Over the cap in ``MAX_LINES`` is an error; the band from
``CREEP_LINES`` is a notice, frozen by ``REGISTER``.
"""

from __future__ import annotations

from pathlib import Path

from backend.foundation.scanners.base import (
    SEVERITY_ERROR,
    SEVERITY_NOTICE,
    Finding,
    Scanner,
)
from backend.foundation.scanners.files import python_files, rel, walk_files

MAX_LINES = 800
CREEP_LINES = 700

CODE_SUFFIXES: tuple[str, ...] = (".js", ".mjs", ".ts", ".tsx", ".css")
EXCLUDED_PARTS = frozenset({"assets", "generated"})

# Ratchet register: (path, recorded count) for files carried
# at or over the band; it only shrinks, and a stale entry is
# itself a finding. Seeded by a repo's adoption, never after.
REGISTER: tuple[tuple[str, int], ...] = (
    ("flavors/webapp/files/packages/ui-kit/tools/verify-contrast.mjs", 1132),
    ("flavors/webapp/files/tools/check.mjs", 769),
    ("ui-kit/tools/verify-contrast.mjs", 1132),
    ("workhorse-kit/tools/verify-contrast.mjs", 1178),
)


def _is_suite(path: Path) -> bool:
    """Whether ``path`` names a test suite (band-exempt)."""
    name = path.name
    return (
        name.startswith("test_")
        or path.stem.endswith("_test")
        or ".test." in name
        or ".spec." in name
    )


def _population(root: Path) -> dict[str, Path]:
    """Scanned files by repo-relative path, exclusions applied."""
    found: dict[str, Path] = {}
    for path in python_files(root) + walk_files(root, CODE_SUFFIXES):
        relpath = rel(root, path)
        if any(part in EXCLUDED_PARTS for part in Path(relpath).parts):
            continue
        found[relpath] = path
    return found


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


def _registered_findings(relpath: str, count: int, recorded: int) -> list[Finding]:
    """Findings for a registered file at its current count."""
    if count < CREEP_LINES:
        return [
            _finding(
                "length/register-stale",
                relpath,
                f"registered at {recorded} lines but now {count}, below "
                f"the {CREEP_LINES}-line band; remove the register entry",
                SEVERITY_ERROR,
            )
        ]
    if count > recorded:
        return [
            _finding(
                "length/register-growth",
                relpath,
                f"registered file grew from {recorded} to {count} lines; "
                "registered files may not grow — decompose instead",
                SEVERITY_ERROR,
            )
        ]
    if count < recorded:
        return [
            _finding(
                "length/register-stale",
                relpath,
                f"registered at {recorded} lines but now {count}; "
                "update the register count down — it only shrinks",
                SEVERITY_ERROR,
            )
        ]
    if count > MAX_LINES:
        return [
            _finding(
                "length/registered-over-cap",
                relpath,
                f"{count} lines, carried over the {MAX_LINES}-line cap "
                "by the register; decomposition is owed",
                SEVERITY_NOTICE,
            )
        ]
    return [_band_notice(relpath, count)]


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    registered = dict(REGISTER)
    seen: set[str] = set()
    for relpath, path in sorted(_population(root).items()):
        try:
            count = len(path.read_text(encoding="utf-8").splitlines())
        except (OSError, UnicodeDecodeError):
            continue
        seen.add(relpath)
        if relpath in registered:
            findings.extend(_registered_findings(relpath, count, registered[relpath]))
        elif count > MAX_LINES:
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
            findings.append(_band_notice(relpath, count))
    for relpath, recorded in REGISTER:
        if relpath not in seen:
            findings.append(
                _finding(
                    "length/register-stale",
                    relpath,
                    f"registered at {recorded} lines but the file is "
                    "gone or unscanned; remove the register entry",
                    SEVERITY_ERROR,
                )
            )
    return findings


SCANNER = Scanner(
    name="length",
    description=(
        "enforce the line cap and creep band on code files, "
        "with the ratchet register freezing listed files"
    ),
    run=scan,
)
