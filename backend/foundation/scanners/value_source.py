"""Restated-value scanner: docs carry intent, sources carry values.

A document that restates a source constant's literal (the
length cap, the sample port, a vitals threshold) is a finding.
"""

from __future__ import annotations

import re
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import rel, walk_files
from backend.foundation.scanners.length import MAX_LINES
from backend.foundation.settings import Settings

EXCLUDED_TREES = ("flavors",)
README_PORT_ALLOWANCE = 1
VITALS_PATTERN = re.compile(r"(LCP|INP|CLS)[^.\n]{0,16}(≤|<|=)\s*\d")


def _markdown_files(root: Path) -> list[Path]:
    found: list[Path] = []
    for path in walk_files(root, (".md",)):
        parts = path.relative_to(root).parts
        if parts and parts[0] in EXCLUDED_TREES and "files" in parts:
            continue
        found.append(path)
    return found


def scan(root: Path) -> list[Finding]:
    cap = str(MAX_LINES)
    port = str(Settings().port)
    cap_re = re.compile(rf"\b{cap}\b")
    port_re = re.compile(rf"\b{port}\b")
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
