"""Restated-value scanner: docs carry intent, sources carry values.

A tracked document that restates a source constant's literal
(the length and folder caps, the port, a vitals threshold) is one.
"""

from __future__ import annotations

import re
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import rel, walk_tracked
from backend.foundation.scanners.structure.folder_density import CREEP_FILES, MAX_FILES
from backend.foundation.scanners.structure.length import MAX_LINES
from backend.foundation.settings import Settings

EXCLUDED_TREES = ("flavors",)
README_PORT_ALLOWANCE = 1
VITALS_PATTERN = re.compile(r"(LCP|INP|CLS)[^.\n]{0,16}(≤|<|=)\s*\d")


def _markdown_files(root: Path) -> list[Path]:
    found: list[Path] = []
    for path in walk_tracked(root, (".md",)):
        parts = path.relative_to(root).parts
        if parts and parts[0] in EXCLUDED_TREES and "files" in parts:
            continue
        found.append(path)
    return found


def _folder_patterns() -> tuple[re.Pattern[str], ...]:
    values = rf"(?:{MAX_FILES}|{CREEP_FILES})"
    return (
        re.compile(rf"\b{values}\b\s+(?:code\s+)?files\b"),
        re.compile(
            rf"(?:folder|density)[^\n]{{0,48}}?(?:cap|band|limit)"
            rf"[^\n]{{0,24}}?\b{values}\b"
        ),
        re.compile(
            rf"\b{values}\b[^\n]{{0,24}}?(?:folder|density)"
            rf"[^\n]{{0,48}}?(?:cap|band|limit)"
        ),
    )


def scan(root: Path) -> list[Finding]:
    cap = str(MAX_LINES)
    port = str(Settings().port)
    cap_re = re.compile(rf"\b{cap}\b")
    port_re = re.compile(rf"\b{port}\b")
    folder_res = _folder_patterns()
    findings: list[Finding] = []
    for path in _markdown_files(root):
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except (OSError, UnicodeDecodeError):
            continue
        port_seen = 0
        for lineno, line in enumerate(lines, start=1):
            if cap_re.search(line):
                findings.append(
                    Finding(
                        scanner="value_source",
                        rule="value-source/restated-cap",
                        path=rel(root, path),
                        line=lineno,
                        message=(
                            "document restates the length cap; the length "
                            "scanner's constant is the only source — name "
                            "the rule, not the value"
                        ),
                    )
                )
            if any(pattern.search(line) for pattern in folder_res):
                findings.append(
                    Finding(
                        scanner="value-source",
                        rule="value-source/restated-folder-density",
                        path=rel(root, path),
                        line=lineno,
                        message=(
                            "document restates a folder-density value; "
                            "the folder_density scanner's constants are "
                            "the only source — name the rule, not the value"
                        ),
                    )
                )
            if VITALS_PATTERN.search(line):
                findings.append(
                    Finding(
                        scanner="value_source",
                        rule="value-source/restated-vitals",
                        path=rel(root, path),
                        line=lineno,
                        message=(
                            "document restates a field-vitals threshold; "
                            "frontend/budgets.json is the only source"
                        ),
                    )
                )
            for _ in port_re.finditer(line):
                port_seen += 1
                allowed = (
                    path.name == "README.md" and port_seen <= README_PORT_ALLOWANCE
                )
                if not allowed:
                    findings.append(
                        Finding(
                            scanner="value-source",
                            rule="value-source/restated-port",
                            path=rel(root, path),
                            line=lineno,
                            message=(
                                "document restates the sample port; the "
                                "settings seam is the only source (the "
                                "README quickstart keeps one literal)"
                            ),
                        )
                    )
    return findings


SCANNER = Scanner(
    name="value_source",
    description="docs never restate a source constant's literal",
    run=scan,
)
