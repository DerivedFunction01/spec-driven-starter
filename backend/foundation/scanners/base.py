"""Base types for repository policy scanners.

One ``Scanner`` is a name plus a callable over a repo root; one
``Finding`` is a single violation. Error findings fail the gate;
notice findings print but never fail (leg-unconfigured reports).
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

SEVERITY_ERROR = "error"
SEVERITY_NOTICE = "notice"


@dataclass(frozen=True)
class Finding:
    """One policy violation (or notice) reported by a scanner."""

    scanner: str
    rule: str
    path: str
    line: int | None
    message: str
    severity: str = SEVERITY_ERROR


@dataclass(frozen=True)
class Scanner:
    """One registered repository scanner."""

    name: str
    description: str
    run: Callable[[Path], list[Finding]]


__all__ = [
    "SEVERITY_ERROR",
    "SEVERITY_NOTICE",
    "Finding",
    "Scanner",
]
