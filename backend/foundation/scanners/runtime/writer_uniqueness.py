"""Writer-uniqueness scanner: one homed stage+rename writer.

AST scan in the superapp leg's form: truncate-writes to
state-shaped paths and re-implemented stage+rename
protocols outside the writer home are findings.
"""

from __future__ import annotations

import ast
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import python_files, rel

EXCLUDED_PATH = "backend/foundation/scanners/runtime/writer_uniqueness.py"
EXCLUDED_PREFIX = "tests/scanners/runtime/test_scanner_writer_uniqueness"
# Test trees are the fixture class, out of scope entirely.
TEST_PREFIX = "tests/"

# The designated writer home: no module lives there yet.
# The first extracted writer lands at this path, and the
# store declaration below retires with it.
WRITER_HOME = "backend/foundation/writer.py"

# Declared seams, in the paths-discipline declaration
# form: {path, kind}. A declaration whose file carries no
# matching pattern any longer is itself a finding.
EXCEPTIONS: tuple[dict[str, str], ...] = (
    {
        "path": "backend/infra/store.py",
        "kind": "the store seam's staged write: the starter's "
        "only stage+rename implementation, sanctioned until "
        "the designated writer home exists",
    },
    {
        "path": "connector/register_caller.py",
        "kind": "standalone connector entry: writes its own "
        "caller-registration record; it runs outside the "
        "backend's import graph",
    },
    {
        "path": "tools/apply_flavor.py",
        "kind": "standalone flavor entry: writes its "
        "applied-flavor marker under var/ when it applies "
        "a flavor to a project",
    },
)

STATE_SEGMENTS = {"var", "state"}
STATE_IDENTIFIERS = {"STATE", "STATE_DIR", "STATE_FILE", "STORE_FILE", "LEDGER_FILE"}
TEMP_MARKERS = (".tmp", "tmp-", ".staging-", "sched-tmp")
WRITE_MODE_CHARS = set("wax")
WRITE_CALLS = ("write_text", "write_bytes")
RENAME_CALLS = ("replace", "rename")


def _call_name(call: ast.Call) -> str:
    func = call.func
    if isinstance(func, ast.Attribute):
        return func.attr
    if isinstance(func, ast.Name):
        return func.id
    return ""


def _expr_facts(node: ast.expr) -> tuple[list[str], list[str]]:
    strings: list[str] = []
    idents: list[str] = []
    for sub in ast.walk(node):
        if isinstance(sub, ast.Constant) and isinstance(sub.value, str):
            strings.append(sub.value)
        elif isinstance(sub, ast.Name):
            idents.append(sub.id)
        elif isinstance(sub, ast.Attribute):
            idents.append(sub.attr)
    return strings, idents


def _is_state_shaped(
    node: ast.expr, assignments: dict[str, ast.expr], depth: int = 0
) -> bool:
    strings, idents = _expr_facts(node)
    for text in strings:
        segments = text.replace("\\", "/").split("/")
        if any(seg in STATE_SEGMENTS for seg in segments):
            return True
        if text.endswith(".jsonl"):
            return True
    for ident in idents:
        if ident in STATE_IDENTIFIERS or ident.startswith("STATE_"):
            return True
    if depth == 0 and isinstance(node, ast.Name) and node.id in assignments:
        return _is_state_shaped(assignments[node.id], assignments, depth=1)
    return False


def _is_temp_shaped(node: ast.expr, assignments: dict[str, ast.expr]) -> bool:
    strings, _idents = _expr_facts(node)
    if any(marker in text for text in strings for marker in TEMP_MARKERS):
        return True
    if isinstance(node, ast.Name) and node.id in assignments:
        value = assignments[node.id]
        for sub in ast.walk(value):
            if isinstance(sub, ast.Call) and _call_name(sub) in (
                "mkstemp",
                "NamedTemporaryFile",
                "mktemp",
            ):
                return True
        strings, _idents = _expr_facts(value)
        if any(marker in text for text in strings for marker in TEMP_MARKERS):
            return True
    return False


def _scope_nodes(scope: ast.AST) -> list[ast.AST]:
    nodes: list[ast.AST] = []
    stack = list(ast.iter_child_nodes(scope))
    while stack:
        node = stack.pop()
        nodes.append(node)
        if isinstance(
            node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef, ast.Lambda)
        ):
            continue
        stack.extend(ast.iter_child_nodes(node))
    return nodes


def _assignments(
    nodes: list[ast.AST], base: dict[str, ast.expr]
) -> dict[str, ast.expr]:
    found = dict(base)
    for node in nodes:
        if (
            isinstance(node, ast.Assign)
            and len(node.targets) == 1
            and isinstance(node.targets[0], ast.Name)
        ):
            found[node.targets[0].id] = node.value
        elif (
            isinstance(node, ast.AnnAssign)
            and isinstance(node.target, ast.Name)
            and node.value is not None
        ):
            found[node.target.id] = node.value
    return found


def _mode_of(call: ast.Call) -> str | None:
    candidate: ast.expr | None = None
    if len(call.args) >= 2:
        candidate = call.args[1]
    for keyword in call.keywords:
        if keyword.arg == "mode":
            candidate = keyword.value
    if isinstance(candidate, ast.Constant) and isinstance(candidate.value, str):
        return candidate.value
    return None


def _write_events(nodes: list[ast.AST]) -> list[tuple[ast.expr, int]]:
    events: list[tuple[ast.expr, int]] = []
    for node in nodes:
        if not isinstance(node, ast.Call):
            continue
        name = _call_name(node)
        if name == "open" and node.args:
            mode = _mode_of(node)
            if mode is not None and WRITE_MODE_CHARS & set(mode):
                events.append((node.args[0], node.lineno))
        elif name in WRITE_CALLS and isinstance(node.func, ast.Attribute):
            events.append((node.func.value, node.lineno))
    return events


def _rename_events(nodes: list[ast.AST]) -> list[tuple[ast.expr, int]]:
    events: list[tuple[ast.expr, int]] = []
    for node in nodes:
        if not isinstance(node, ast.Call):
            continue
        func = node.func
        if not isinstance(func, ast.Attribute) or func.attr not in RENAME_CALLS:
            continue
        if isinstance(func.value, ast.Name) and func.value.id == "os":
            if node.args:
                events.append((node.args[0], node.lineno))
        else:
            events.append((func.value, node.lineno))
    return events


def _scan_scope(
    nodes: list[ast.AST], assignments: dict[str, ast.expr]
) -> list[tuple[int, str]]:
    rows: list[tuple[int, str]] = []
    writes = _write_events(nodes)
    renames = _rename_events(nodes)
    renamed = {ast.dump(source) for source, _ln in renames}
    for target, lineno in writes:
        if ast.dump(target) in renamed:
            continue
        if _is_temp_shaped(target, assignments):
            continue
        if _is_state_shaped(target, assignments):
            rows.append((lineno, "truncate-write"))
    if writes and renames:
        written = {ast.dump(target) for target, _ln in writes}
        hits = [lineno for source, lineno in renames if ast.dump(source) in written]
        if hits:
            has_fsync = any(
                isinstance(node, ast.Call) and _call_name(node) == "fsync"
                for node in nodes
            )
            kind = "duplicate-staged-write" if has_fsync else "partial-staged-write"
            rows.append((min(hits), kind))
    return rows


def _scan_source(text: str) -> list[tuple[int, str]]:
    try:
        tree = ast.parse(text)
    except SyntaxError:
        return []
    module_nodes = _scope_nodes(tree)
    module_assignments = _assignments(module_nodes, {})
    rows = _scan_scope(module_nodes, module_assignments)
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            nodes = _scope_nodes(node)
            assignments = _assignments(nodes, module_assignments)
            rows.extend(_scan_scope(nodes, assignments))
    rows.sort()
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
        if relpath == WRITER_HOME or relpath == "writer.py":
            continue
        scanned.add(relpath)
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        declared = _declared_kind(relpath)
        for lineno, kind in _scan_source(text):
            found_in.setdefault(relpath, []).append(kind)
            if declared is not None:
                continue
            findings.append(
                Finding(
                    scanner="writer_uniqueness",
                    rule=f"writer-uniqueness/{kind}",
                    path=relpath,
                    line=lineno,
                    message=(
                        f"{kind} outside the designated writer home "
                        f"({WRITER_HOME}); route the write through the "
                        "one writer, or declare the seam in the "
                        "scanner's exception data"
                    ),
                )
            )
    for decl in EXCEPTIONS:
        if decl["path"] in scanned and not found_in.get(decl["path"]):
            findings.append(
                Finding(
                    scanner="writer_uniqueness",
                    rule="writer-uniqueness/stale-exception",
                    path=decl["path"],
                    line=None,
                    message=(
                        "a declared seam no longer carries a matching "
                        "write pattern; remove or re-argue it in the "
                        "scanner's exception data"
                    ),
                )
            )
    return findings


SCANNER = Scanner(
    name="writer_uniqueness",
    description="state writes ride the one homed stage+rename writer",
    run=scan,
)
