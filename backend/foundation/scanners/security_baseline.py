"""Security-baseline scanner: the baseline's checkable legs.

No dynamic-execution or unsafe-deserialization calls in the
backend, and the security headers set in the apps layer. The
other legs are design review, not static checks.
"""

from __future__ import annotations

import re
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import python_files, rel

BANNED_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("eval-call", re.compile(r"\beval\s*\(")),
    ("exec-call", re.compile(r"\bexec\s*\(")),
    ("dunder-import", re.compile(r"__import__\s*\(")),
    ("pickle-load", re.compile(r"\bpickle\.loads?\s*\(")),
    ("marshal-load", re.compile(r"\bmarshal\.loads?\s*\(")),
    ("os-system", re.compile(r"\bos\.system\s*\(")),
    ("shell-true", re.compile(r"\bshell\s*=\s*True\b")),
    ("debug-true", re.compile(r"\bdebug\s*=\s*True\b")),
)

REQUIRED_HEADERS = (
    "Content-Security-Policy",
    "Referrer-Policy",
    "X-Content-Type-Options",
    "X-Frame-Options",
)
SERVER_MARKERS = ("BaseHTTPRequestHandler", "send_response", "Flask", "FastAPI")


def _read(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return None


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for path in python_files(root, "backend"):
        text = _read(path)
        if text is None:
            continue
        for lineno, line in enumerate(text.splitlines(), start=1):
            for rule, pattern in BANNED_PATTERNS:
                if pattern.search(line):
                    findings.append(
                        Finding(
                            scanner="security_baseline",
                            rule=f"security-baseline/{rule}",
                            path=rel(root, path),
                            line=lineno,
                            message=(
                                "the security baseline bans this pattern in "
                                "backend code (docs/fundamentals.md)"
                            ),
                        )
                    )
    apps_text = ""
    server_seen = False
    for path in python_files(root, "backend/apps"):
        text = _read(path)
        if text is None:
            continue
        apps_text += text
        if any(marker in text for marker in SERVER_MARKERS):
            server_seen = True
    if server_seen:
        for header in REQUIRED_HEADERS:
            if header not in apps_text:
                findings.append(
                    Finding(
                        scanner="security_baseline",
                        rule="security-baseline/missing-header",
                        path="backend/apps",
                        line=None,
                        message=(
                            f"security response header {header} is not set "
                            "in the apps layer; headers are set once at the "
                            "shell so every route inherits them"
                        ),
                    )
                )
    return findings


SCANNER = Scanner(
    name="security_baseline",
    description="banned dynamic patterns absent; security headers set at the shell",
    run=scan,
)
