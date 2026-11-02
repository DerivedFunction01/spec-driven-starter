"""Tracking scanner: runtime never lives in tracked source.

Any tracked path under ``var/`` (via ``git ls-files``) is a
finding. When git cannot answer, the leg degrades to a notice
rather than failing or passing silently.
"""

from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

from backend.foundation.scanners.base import SEVERITY_NOTICE, Finding, Scanner


def _unavailable_notice(reason: str) -> Finding:
    return Finding(
        scanner="tracking",
        rule="tracking/var-unchecked",
        path="-",
        line=None,
        message=f"git ls-files unavailable ({reason}); var/ check skipped",
        severity=SEVERITY_NOTICE,
    )


def scan(root: Path) -> list[Finding]:
    git = shutil.which("git")
    if git is None:
        return [_unavailable_notice("git not on PATH")]
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
        return [_unavailable_notice("git failed to run")]
    if result.returncode != 0:
        return [_unavailable_notice("not a git checkout")]
    findings: list[Finding] = []
    for line in result.stdout.splitlines():
        tracked = line.strip()
        if tracked.startswith("var/"):
            findings.append(
                Finding(
                    scanner="tracking",
                    rule="tracking/var-tracked",
                    path=tracked,
                    line=None,
                    message="runtime file under var/ is tracked",
                )
            )
    return findings


SCANNER = Scanner(
    name="tracking",
    description="no tracked files under var/ (git ls-files)",
    run=scan,
)
