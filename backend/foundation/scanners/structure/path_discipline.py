"""Path-discipline scanner: path derivation has one spine.

Text-level scan in the superapp leg's form: root climbs,
cwd roots, and hardcoded home roots outside the paths
spine are findings. Declarations below are data.
"""

from __future__ import annotations

import re
from pathlib import Path

from backend.foundation.scanners.base import (
    SEVERITY_NOTICE,
    Finding,
    Scanner,
)
from backend.foundation.scanners.files import python_files, rel

EXCLUDED_PATH = "backend/foundation/scanners/structure/path_discipline.py"
EXCLUDED_PREFIX = "tests/scanners/structure/test_scanner_path_discipline"
# Test trees are the standing declaration (fixture location
# derivation), so the tests/ tree is out of scope entirely.
TEST_PREFIX = "tests/"

CLIMB_PARENTS = re.compile(r"__file__[^\n]*\.parents\[\s*[1-9]")
CLIMB_PARENT_CHAIN = re.compile(r"__file__[^\n]*\.parent\.parent")
DIRNAME = re.compile(r"dirname\s*\(")
JOIN_SEGMENT = re.compile(r"[\"']\.\.[\"']")
CWD_ROOT = re.compile(r"os\.getcwd\(\)|Path\.cwd\(\)")
HARDCODED_ROOT = re.compile(r"[\"']" + "/home/")

PATHS_MODULE_NAMES = ("paths.py", "paths.sh")

# Declared derivations, in the leg's declaration form:
# {path, kind}. A declared finding prints as a notice with
# its kind and never fails the gate.
EXCEPTIONS: tuple[dict[str, str], ...] = (
    {
        "path": "backend/foundation/settings.py",
        "kind": "the settings seam: the starter's one root "
        "derivation until a paths spine module exists",
    },
    {
        "path": "backend/foundation/checks/runner.py",
        "kind": "the gate harness's own repo-root derivation",
    },
    {
        "path": "backend/foundation/scanners/content/portability.py",
        "kind": "the portability scanner: its home-anchor "
        "literals are pattern data, not a derivation",
    },
    {
        "path": "connector/register_caller.py",
        "kind": "standalone connector entry: derives its repo "
        "root before any spine is importable",
    },
    {
        "path": "tools/apply_flavor.py",
        "kind": "standalone flavor entry: derives its repo "
        "root before any spine is importable",
    },
    {
        "path": "tools/sync_spec_files.py",
        "kind": "standalone spec-sync entry: derives its repo "
        "root before any spine is importable",
    },
)


def _references_paths_module(text: str) -> bool:
    return "paths.py" in text or "paths.sh" in text


def _scan_text(text: str) -> list[tuple[int, str]]:
    rows: list[tuple[int, str]] = []
    lines = text.splitlines()
    for i, line in enumerate(lines):
        ctx = lines[i - 1] + "\n" + line if i else line
        lineno = i + 1
        if _references_paths_module(ctx):
            pass
        elif "__file__" in ctx and (
            CLIMB_PARENTS.search(ctx)
            or CLIMB_PARENT_CHAIN.search(ctx)
            or len(DIRNAME.findall(ctx)) >= 2
            or (JOIN_SEGMENT.search(line) and ("__file__" in ctx or "dirname" in ctx))
        ):
            rows.append((lineno, "root-climb"))
            continue
        if CWD_ROOT.search(line):
            rows.append((lineno, "cwd-root"))
        elif HARDCODED_ROOT.search(line):
            rows.append((lineno, "hardcoded-root"))
    return rows


def _declared_kind(relpath: str) -> str | None:
    for decl in EXCEPTIONS:
        path = decl["path"]
        if path.endswith("/**"):
            prefix = path[:-3]
            if relpath == prefix or relpath.startswith(prefix + "/"):
                return decl["kind"]
        elif relpath == path:
            return decl["kind"]
    return None


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    found_in: dict[str, list[str]] = {}
    scanned: set[str] = set()
    for path in python_files(root):
        relpath = rel(root, path)
        if relpath == EXCLUDED_PATH or relpath.startswith(EXCLUDED_PREFIX):
            continue
        if relpath.startswith(TEST_PREFIX):
            continue
        if relpath.rsplit("/", 1)[-1] in PATHS_MODULE_NAMES:
            continue
        scanned.add(relpath)
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        kind = _declared_kind(relpath)
        for lineno, finding_kind in _scan_text(text):
            found_in.setdefault(relpath, []).append(finding_kind)
            if kind is None:
                findings.append(
                    Finding(
                        scanner="path_discipline",
                        rule=f"path-discipline/{finding_kind}",
                        path=relpath,
                        line=lineno,
                        message=(
                            f"{finding_kind} derivation outside a paths "
                            "module; derive it in the paths spine, or "
                            "declare it in the scanner's exception data"
                        ),
                    )
                )
            else:
                findings.append(
                    Finding(
                        scanner="path_discipline",
                        rule=f"path-discipline/{finding_kind}",
                        path=relpath,
                        line=lineno,
                        message=f"declared derivation: {kind}",
                        severity=SEVERITY_NOTICE,
                    )
                )
    for decl in EXCEPTIONS:
        covered = [
            relpath
            for relpath in scanned
            if _declared_kind(relpath) == decl["kind"] and relpath == decl["path"]
        ]
        if covered and not any(found_in.get(relpath) for relpath in covered):
            findings.append(
                Finding(
                    scanner="path_discipline",
                    rule="path-discipline/stale-exception",
                    path=decl["path"],
                    line=None,
                    message=(
                        "a declared exception no longer carries its "
                        "pattern; remove or re-argue it in the "
                        "scanner's exception data"
                    ),
                )
            )
    return findings


SCANNER = Scanner(
    name="path_discipline",
    description="path derivations live in the one paths spine",
    run=scan,
)
