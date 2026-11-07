"""Port-boundary scanner: provider strings live in vendors only.

A provider's name may appear in code only under a ``vendors/``
path segment. This module is excluded from its own scan: it
holds the term list, as the literal scanner holds its shapes.
"""

from __future__ import annotations

import re
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import rel, walk_files

SCAN_SUFFIXES = (".py", ".js", ".mjs", ".ts", ".tsx")
EXCLUDED_PREFIX = "tests/test_scanner_"
EXCLUDED_PATH = "backend/foundation/scanners/port_boundary.py"
ALLOWED_SEGMENTS = ("vendors", "vendor")

PROVIDER_TERMS = (
    "stripe",
    "twilio",
    "sendgrid",
    "mailchimp",
    "openai",
    "anthropic",
    "paypal",
    "boto3",
    "firebase",
    "supabase",
    "algolia",
    "intercom",
)

TERM_RE = re.compile(
    r"\b(" + "|".join(re.escape(term) for term in PROVIDER_TERMS) + r")\b",
    re.IGNORECASE,
)


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for path in walk_files(root, SCAN_SUFFIXES):
        relpath = rel(root, path)
        if relpath.startswith(EXCLUDED_PREFIX) or relpath == EXCLUDED_PATH:
            continue
        if any(segment in ALLOWED_SEGMENTS for segment in path.parts):
            continue
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except (OSError, UnicodeDecodeError):
            continue
        for lineno, line in enumerate(lines, start=1):
            match = TERM_RE.search(line)
            if match:
                findings.append(
                    Finding(
                        scanner="port_boundary",
                        rule="port-boundary/provider-string",
                        path=relpath,
                        line=lineno,
                        message=(
                            f"provider name '{match.group(1).lower()}' in code "
                            "outside a vendors/ module; provider specifics "
                            "belong behind the port"
                        ),
                    )
                )
    return findings


SCANNER = Scanner(
    name="port_boundary",
    description="provider strings in code live only in a vendors/ module",
    run=scan,
)
