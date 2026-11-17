"""Adapter-mirror scanner: implementations stay mirrors.

Adapted from Steam's module-map form: the mirror obligation
is the protocol's method set, derived from the protocol
class at scan time — every implementation defines all of it.
"""

from __future__ import annotations

import ast
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner

# The mirror contract is data: the adapter modules under
# scan, and the protocol class whose method set every
# implementation must carry in full.
ADAPTER_MODULES: tuple[str, ...] = ("backend/infra/store.py",)
PROTOCOL_CLASS = "Store"

# Sanctioned partial implementations: {module, class, kind}.
# An entry whose class is gone, or now carries the full
# protocol, is itself a finding (stale-exception).
ALLOWLIST: tuple[dict[str, str], ...] = ()


def _classes(tree: ast.Module) -> dict[str, ast.ClassDef]:
    return {node.name: node for node in tree.body if isinstance(node, ast.ClassDef)}


def _methods(node: ast.ClassDef) -> set[str]:
    return {
        child.name
        for child in node.body
        if isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef))
    }


def _scan_module(
    relpath: str, text: str, protocol_methods: set[str] | None
) -> tuple[list[Finding], set[str], set[str] | None]:
    findings: list[Finding] = []
    try:
        tree = ast.parse(text)
    except SyntaxError:
        return findings, set(), protocol_methods
    classes = _classes(tree)
    if protocol_methods is None and PROTOCOL_CLASS in classes:
        protocol_methods = _methods(classes[PROTOCOL_CLASS])
    if protocol_methods is None:
        return findings, set(classes), None
    implementations: set[str] = set()
    for name, node in classes.items():
        if name == PROTOCOL_CLASS:
            continue
        methods = _methods(node)
        if not methods & protocol_methods:
            continue
        implementations.add(name)
        missing = protocol_methods - methods
        if not missing:
            continue
        allowlisted = any(
            entry["module"] == relpath and entry["class"] == name for entry in ALLOWLIST
        )
        if allowlisted:
            continue
        findings.append(
            Finding(
                scanner="adapter_mirror",
                rule="adapter-mirror/partial-implementation",
                path=relpath,
                line=node.lineno,
                message=(
                    f"adapter class {name} carries only part of the "
                    f"{PROTOCOL_CLASS} protocol (missing: "
                    f"{', '.join(sorted(missing))}); an implementation "
                    "mirrors the full method set or is allowlisted "
                    "with its reason"
                ),
            )
        )
    return findings, implementations, protocol_methods


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    protocol_methods: set[str] | None = None
    class_sets: dict[str, set[str]] = {}
    present: dict[str, dict[str, ast.ClassDef]] = {}
    for module in ADAPTER_MODULES:
        path = root / module
        if not path.is_file():
            findings.append(
                Finding(
                    scanner="adapter_mirror",
                    rule="adapter-mirror/missing-module",
                    path=module,
                    line=None,
                    message=(
                        "a declared adapter module does not exist; "
                        "the mirror contract names a module the tree "
                        "no longer carries"
                    ),
                )
            )
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        module_findings, implementations, protocol_methods = _scan_module(
            module, text, protocol_methods
        )
        findings.extend(module_findings)
        class_sets[module] = implementations
        try:
            present[module] = _classes(ast.parse(text))
        except SyntaxError:
            present[module] = {}
    if len(class_sets) > 1:
        union = set().union(*class_sets.values())
        for module, names in class_sets.items():
            for missing in sorted(union - names):
                allowlisted = any(
                    entry["module"] == module and entry["class"] == missing
                    for entry in ALLOWLIST
                )
                if allowlisted:
                    continue
                findings.append(
                    Finding(
                        scanner="adapter_mirror",
                        rule="adapter-mirror/unmirrored-class",
                        path=module,
                        line=None,
                        message=(
                            f"adapter class {missing} has no mirror in "
                            "this module; adapter modules carry the "
                            "same class set or allowlist the asymmetry"
                        ),
                    )
                )
    for entry in ALLOWLIST:
        module, name = entry["module"], entry["class"]
        node = present.get(module, {}).get(name)
        stale = node is None
        if node is not None and protocol_methods is not None:
            stale = not (protocol_methods - _methods(node))
        if stale:
            findings.append(
                Finding(
                    scanner="adapter_mirror",
                    rule="adapter-mirror/stale-exception",
                    path=module,
                    line=None,
                    message=(
                        f"the allowlist entry for {name} no longer "
                        "covers an asymmetry; remove or re-argue it"
                    ),
                )
            )
    return findings


SCANNER = Scanner(
    name="adapter_mirror",
    description="adapter implementations mirror the protocol's full method set",
    run=scan,
)
