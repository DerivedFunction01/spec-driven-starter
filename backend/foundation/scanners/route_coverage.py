"""Route-coverage scanner: every served route is enrolled.

Enrollment is ``spec/route-coverage.md``: a route appears in
backticks, or carries an exemption with an expiry date. An
expired exemption fails like an unenrolled route.
"""

from __future__ import annotations

import re
from datetime import date
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import python_files, rel

REGISTRY = "spec/route-coverage.md"
ROUTE_RE = re.compile(r"""['"](/[A-Za-z0-9_./{}-]*)['"]""")
ENROLLED_RE = re.compile(r"`(/[A-Za-z0-9_./{}-]*)`")
EXEMPT_RE = re.compile(
    r"exempt\s+`(/[A-Za-z0-9_./{}-]*)`\s+until\s+(\d{4}-\d{2}-\d{2})"
)


def _routes(root: Path) -> dict[str, tuple[str, int]]:
    """Map of route -> (path, line) from the apps layer."""
    found: dict[str, tuple[str, int]] = {}
    for path in python_files(root, "backend/apps"):
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except (OSError, UnicodeDecodeError):
            continue
        for lineno, line in enumerate(lines, start=1):
            for match in ROUTE_RE.finditer(line):
                found.setdefault(match.group(1), (rel(root, path), lineno))
    return found


def _enrollment(root: Path) -> tuple[set[str], dict[str, str]]:
    """Enrolled routes and exemptions (route -> expiry) from the registry."""
    registry = root / REGISTRY
    if not registry.is_file():
        return set(), {}
    try:
        text = registry.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return set(), {}
    exemptions = {m.group(1): m.group(2) for m in EXEMPT_RE.finditer(text)}
    return set(ENROLLED_RE.findall(text)), exemptions


def scan(root: Path) -> list[Finding]:
    routes = _routes(root)
    if not routes:
        return []
    enrolled, exemptions = _enrollment(root)
    today = date.today().isoformat()
    findings: list[Finding] = []
    for route, (path, lineno) in sorted(routes.items()):
        if route in enrolled and route not in exemptions:
            continue
        expiry = exemptions.get(route)
        if expiry is not None and expiry >= today:
            continue
        if expiry is not None:
            message = f"route {route}: exemption in {REGISTRY} expired {expiry}"
            rule = "route-coverage/exemption-expired"
        else:
            message = f"route {route} is served but not enrolled in {REGISTRY}"
            rule = "route-coverage/unenrolled"
        findings.append(
            Finding(
                scanner="route_coverage",
                rule=rule,
                path=path,
                line=lineno,
                message=message,
            )
        )
    return findings


SCANNER = Scanner(
    name="route_coverage",
    description="every served route is enrolled in spec/route-coverage.md",
    run=scan,
)
