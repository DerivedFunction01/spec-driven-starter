"""Performance-budget scanner: frontend weight vs its budget.

Budgets live in ``frontend/budgets.json`` (KB per class). With
a frontend but no budget file, the leg reports itself
unconfigured as a notice and never fails.
"""

from __future__ import annotations

import json
from pathlib import Path

from backend.foundation.scanners.base import SEVERITY_NOTICE, Finding, Scanner
from backend.foundation.scanners.files import rel, walk_files

BUDGETS = "frontend/budgets.json"
EXCLUDED_NAMES = ("budgets.json", "assets-manifest.json")
CLASSES: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("script_kb", (".js", ".mjs")),
    ("style_kb", (".css",)),
    ("image_kb", (".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico")),
    ("font_kb", (".woff", ".woff2")),
)


def _weights(root: Path) -> dict[str, float]:
    weights = {key: 0.0 for key, _ in CLASSES}
    weights["total_kb"] = 0.0
    base = root / "frontend"
    suffix_class = {s: key for key, suffixes in CLASSES for s in suffixes}
    for path in walk_files(base, tuple(suffix_class)):
        weights[suffix_class[path.suffix]] += path.stat().st_size / 1024
    for path in base.rglob("*"):
        if path.is_file() and path.name not in EXCLUDED_NAMES:
            weights["total_kb"] += path.stat().st_size / 1024
    return weights


def scan(root: Path) -> list[Finding]:
    base = root / "frontend"
    if not base.is_dir():
        return []
    budget_path = root / BUDGETS
    if not budget_path.is_file():
        return [
            Finding(
                scanner="perf_budget",
                rule="perf-budget/unconfigured",
                path=BUDGETS,
                line=None,
                message=(
                    "performance leg unconfigured: no frontend/budgets.json; "
                    "the budget is a spec decision (docs/fundamentals.md)"
                ),
                severity=SEVERITY_NOTICE,
            )
        ]
    try:
        document = json.loads(budget_path.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return []
    budgets = document.get("budgets", {})
    vitals = document.get("vitals", {})
    findings: list[Finding] = []
    for key in ("lcp_s", "inp_ms", "cls"):
        value = vitals.get(key)
        if not isinstance(value, (int, float)) or isinstance(value, bool) or value <= 0:
            findings.append(
                Finding(
                    scanner="perf_budget",
                    rule="perf-budget/vitals-unconfigured",
                    path=BUDGETS,
                    line=None,
                    message=(
                        f"field-vitals threshold {key} missing or not a "
                        "positive number; budgets.json is its only source"
                    ),
                )
            )
    weights = _weights(root)
    for key, weight in sorted(weights.items()):
        budget = budgets.get(key)
        if budget is not None and weight > budget:
            findings.append(
                Finding(
                    scanner="perf_budget",
                    rule="perf-budget/over-budget",
                    path=rel(root, base),
                    line=None,
                    message=(
                        f"{key}: {weight:.1f} KB shipped against a {budget} KB budget"
                    ),
                )
            )
    return findings


SCANNER = Scanner(
    name="perf_budget",
    description="frontend asset weight stays inside frontend/budgets.json",
    run=scan,
)
