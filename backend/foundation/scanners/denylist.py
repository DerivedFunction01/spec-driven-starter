"""Denylist scanner: personal literals from an untracked file.

The file named by ``STARTER_DENYLIST_FILE`` wins; a set but
unreadable env path reports unconfigured, never falls back.
Else the default under ``var/config/`` applies when present.
"""

from __future__ import annotations

import os
from pathlib import Path

from backend.foundation.scanners.base import SEVERITY_NOTICE, Finding, Scanner
from backend.foundation.scanners.files import rel
from backend.foundation.scanners.portability import scanned_files

DENYLIST_ENV_VAR = "STARTER_DENYLIST_FILE"
DEFAULT_DENYLIST_PATH = Path("var/config/denylist.txt")


def _resolve_denylist(root: Path) -> tuple[Path | None, bool]:
    """(path, from_env) for the denylist in force, if any."""
    raw = os.environ.get(DENYLIST_ENV_VAR)
    if raw:
        return Path(raw), True
    default = root / DEFAULT_DENYLIST_PATH
    if default.is_file():
        return default, False
    return None, False


def _load_denylist(root: Path) -> tuple[list[str] | None, str | None]:
    """(literals, notice) — exactly one of the two is not None."""
    denylist_path, from_env = _resolve_denylist(root)
    if denylist_path is None:
        return None, (
            f"personal leg unconfigured: {DENYLIST_ENV_VAR} is not set "
            f"and no default denylist at {DEFAULT_DENYLIST_PATH} exists"
        )
    try:
        lines = denylist_path.read_text(encoding="utf-8").splitlines()
    except OSError:
        source = (
            f"denylist file named by {DENYLIST_ENV_VAR}"
            if from_env
            else "default denylist file"
        )
        return None, f"personal leg unconfigured: {source} could not be read"
    literals = [
        line.strip()
        for line in lines
        if line.strip() and not line.strip().startswith("#")
    ]
    return literals, None


def _read_lines(path: Path) -> list[str] | None:
    try:
        return path.read_text(encoding="utf-8").splitlines()
    except (OSError, UnicodeDecodeError):
        return None


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    literals, notice = _load_denylist(root)
    if notice is not None:
        findings.append(
            Finding(
                scanner="denylist",
                rule="denylist/personal-unconfigured",
                path="-",
                line=None,
                message=notice,
                severity=SEVERITY_NOTICE,
            )
        )
        return findings
    denylist_path, _from_env = _resolve_denylist(root)
    denylist_real = None
    if denylist_path is not None:
        try:
            denylist_real = denylist_path.resolve()
        except OSError:
            denylist_real = None
    for path in scanned_files(root):
        if denylist_real is not None:
            try:
                if path.resolve() == denylist_real:
                    continue  # never scan the denylist itself
            except OSError:
                pass
        lines = _read_lines(path)
        if lines is None:
            continue
        for lineno, line in enumerate(lines, start=1):
            if any(literal in line for literal in literals or []):
                # NEVER include the literal or the line content here.
                findings.append(
                    Finding(
                        scanner="denylist",
                        rule="denylist/personal",
                        path=rel(root, path),
                        line=lineno,
                        message=(
                            "personal denylist literal present (content withheld)"
                        ),
                    )
                )
    return findings


SCANNER = Scanner(
    name="denylist",
    description="no personal denylist literals in tracked content",
    run=scan,
)
