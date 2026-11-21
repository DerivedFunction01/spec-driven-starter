"""Time-ownership scanner: one home owns date/time derivation.

Shape-based AST scan in the superapp leg's form: a thin
wrapper performing one family's intent is a private copy.
The family map below is data; extend it, not the rules.
"""

from __future__ import annotations

import ast
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import python_files, rel

EXCLUDED_PATH = "backend/foundation/scanners/runtime/time_ownership.py"
EXCLUDED_PREFIX = "tests/scanners/runtime/test_scanner_time_ownership"

# The family -> home map is scanner data: each family names
# its one homed module and its exports. The starter's home
# is designated, not yet built — the first helper lands there.
FAMILIES: dict[str, dict[str, object]] = {
    "parse": {
        "home": "backend/foundation/dates.py",
        "exports": ("parse_iso", "parse_day"),
    },
    "normalize": {
        "home": "backend/foundation/dates.py",
        "exports": ("as_datetime",),
    },
    "format": {
        "home": "backend/foundation/dates.py",
        "exports": ("iso_format", "format_stamp"),
    },
    "epoch": {
        "home": "backend/foundation/dates.py",
        "exports": ("to_epoch",),
    },
    "now": {
        "home": "backend/foundation/dates.py",
        "exports": ("now_utc", "now_stamp"),
    },
}

# Function-level private copies sanctioned with their
# reason: {path, function, family, kind}. A sanction whose
# function stops matching is a stale-exception finding.
SANCTIONED_COPIES: tuple[dict[str, str], ...] = ()

# Foreign derivation machinery: importing either module
# outside a family home is a finding in its own right.
FOREIGN_MODULES = ("dateutil", "calendar")

PARSE_OK = {
    "fromisoformat",
    "strptime",
    "replace",
    "strip",
    "astimezone",
    "isinstance",
    "bool",
    "len",
    "str",
}
EPOCH_OK = PARSE_OK | {"timestamp", "fromtimestamp", "float", "int", "round"}
NOW_OK = {
    "now",
    "utcnow",
    "isoformat",
    "strftime",
    "timestamp",
    "astimezone",
    "time",
    "replace",
}
FORMAT_OK = {"isoformat", "strftime", "astimezone"}
GMTIME_OK = {"strftime", "gmtime", "localtime", "time"}


def _call_name(call: ast.Call) -> str:
    func = call.func
    if isinstance(func, ast.Attribute):
        return func.attr
    if isinstance(func, ast.Name):
        return func.id
    return ""


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


def _contains_call(node: ast.AST, names: tuple[str, ...]) -> bool:
    return any(
        isinstance(sub, ast.Call) and _call_name(sub) in names for sub in ast.walk(node)
    )


def _facts(fn: ast.FunctionDef | ast.AsyncFunctionDef) -> dict[str, object]:
    nodes = _scope_nodes(fn)
    calls = [(_call_name(n), n) for n in nodes if isinstance(n, ast.Call)]
    names = [name for name, _ in calls]
    assignments: dict[str, list[ast.expr]] = {}
    for node in nodes:
        if (
            isinstance(node, ast.Assign)
            and len(node.targets) == 1
            and isinstance(node.targets[0], ast.Name)
        ):
            assignments.setdefault(node.targets[0].id, []).append(node.value)
    returns = [
        n.value for n in nodes if isinstance(n, ast.Return) and n.value is not None
    ]

    def parse_derived(expr: ast.expr, depth: int = 0) -> bool:
        if _contains_call(expr, ("fromisoformat", "strptime")):
            return True
        if depth == 0 and isinstance(expr, ast.Name):
            return any(
                parse_derived(value, 1) for value in assignments.get(expr.id, [])
            )
        return False

    def arg_derived(expr: ast.expr) -> bool:
        if not isinstance(expr, ast.Name):
            return False
        return any(
            isinstance(value, ast.Name) for value in assignments.get(expr.id, [])
        )

    facts: dict[str, object] = {
        "calls": set(names),
        "fromisoformat": "fromisoformat" in names,
        "strptime": "strptime" in names,
        "timestamp": "timestamp" in names,
        "time_time": any(
            name == "time"
            and isinstance(call.func, ast.Attribute)
            and isinstance(call.func.value, ast.Name)
            and call.func.value.id == "time"
            for name, call in calls
        ),
        "isinstance_dt": any(
            name == "isinstance"
            and len(call.args) >= 2
            and any(
                (isinstance(sub, ast.Name) and sub.id == "datetime")
                or (isinstance(sub, ast.Attribute) and sub.attr == "datetime")
                for sub in ast.walk(call.args[1])
            )
            for name, call in calls
        ),
        "returns_parse": any(parse_derived(r) for r in returns),
        "returns_name": any(isinstance(r, ast.Name) for r in returns),
        "returns_arg": any(arg_derived(r) for r in returns),
        "gmtime": "gmtime" in names,
        "returns_timestamp": any(_contains_call(r, ("timestamp",)) for r in returns),
        "returns_now": any(_contains_call(r, ("now", "utcnow")) for r in returns),
        "returns_format": any(
            _contains_call(r, ("isoformat", "strftime")) for r in returns
        ),
    }
    facts["date_ops"] = any(
        [
            facts["fromisoformat"],
            facts["strptime"],
            facts["timestamp"],
            facts["returns_format"],
            facts["returns_now"],
            facts["time_time"],
        ]
    )
    return facts


def _classify(facts: dict[str, object]) -> str | None:
    names = facts["calls"]
    assert isinstance(names, set)
    if (
        facts["isinstance_dt"]
        and facts["fromisoformat"]
        and (facts["returns_name"] or facts["returns_arg"])
        and facts["returns_parse"]
    ):
        return "normalize"
    if (
        (facts["fromisoformat"] or facts["strptime"])
        and facts["returns_parse"]
        and names <= PARSE_OK
    ):
        return "parse"
    if facts["timestamp"] and facts["returns_timestamp"] and names <= EPOCH_OK:
        return "epoch"
    if "strftime" in names and facts["gmtime"] and names <= GMTIME_OK:
        return "now"
    if names <= NOW_OK and (facts["returns_now"] or facts["time_time"]):
        return "now"
    if (
        facts["returns_format"]
        and not (facts["fromisoformat"] or facts["strptime"])
        and names <= FORMAT_OK
    ):
        return "format"
    return None


def _functions_of(tree: ast.Module) -> list[tuple[str, ast.AST]]:
    found: list[tuple[str, ast.AST]] = []

    def visit(node: ast.AST, prefix: list[str]) -> None:
        for child in ast.iter_child_nodes(node):
            if isinstance(child, ast.ClassDef):
                visit(child, prefix + [child.name])
            elif isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef)):
                found.append((".".join(prefix + [child.name]), child))
                visit(child, prefix + [child.name])
            else:
                visit(child, prefix)

    visit(tree, [])
    return found


def _foreign_imports(tree: ast.Module) -> list[tuple[int, str]]:
    hits: list[tuple[int, str]] = []
    for node in ast.walk(tree):
        module = None
        if isinstance(node, ast.Import):
            module = node.names[0].name if node.names else None
        elif isinstance(node, ast.ImportFrom):
            module = node.module
        if module and module.split(".")[0] in FOREIGN_MODULES:
            hits.append((node.lineno, module.split(".")[0]))
    return hits


def _slice_findings(tree: ast.Module) -> list[int]:
    lines: list[int] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Subscript) and isinstance(node.value, ast.Call):
            func = node.value.func
            if isinstance(func, ast.Attribute) and func.attr == "isoformat":
                lines.append(node.lineno)
    return lines


def _scan_source(text: str) -> list[tuple[int, str, str]]:
    try:
        tree = ast.parse(text)
    except SyntaxError:
        return []
    rows: list[tuple[int, str, str]] = []
    for _qualname, fn in _functions_of(tree):
        facts = _facts(fn)  # type: ignore[arg-type]
        if not facts["date_ops"]:
            continue
        family = _classify(facts)
        if family:
            rows.append((fn.lineno, family, fn.name))  # type: ignore[attr-defined]
    for lineno, module in _foreign_imports(tree):
        rows.append((lineno, "machinery", module))
    for lineno in _slice_findings(tree):
        rows.append((lineno, "slice", "isoformat"))
    rows.sort()
    return rows


def _is_test_class(relpath: str) -> bool:
    parts = relpath.split("/")
    return "tests" in parts or parts[-1].startswith("test_")


def _homes() -> dict[str, set[str]]:
    return {family: {str(spec["home"])} for family, spec in FAMILIES.items()}


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    homes = _homes()
    matched_sanctions: set[int] = set()
    scanned: dict[str, str] = {}
    for path in python_files(root):
        relpath = rel(root, path)
        if relpath == EXCLUDED_PATH or relpath.startswith(EXCLUDED_PREFIX):
            continue
        if _is_test_class(relpath):
            continue
        try:
            scanned[relpath] = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
    for relpath in sorted(scanned):
        for lineno, family, name in _scan_source(scanned[relpath]):
            if family == "machinery":
                if any(relpath in paths for paths in homes.values()):
                    continue
                findings.append(
                    Finding(
                        scanner="time_ownership",
                        rule="time-ownership/foreign-machinery",
                        path=relpath,
                        line=lineno,
                        message=(
                            f"imports {name} outside the date/time home; "
                            "calendar arithmetic belongs to the home module "
                            "named in the scanner's family map"
                        ),
                    )
                )
                continue
            if family == "slice":
                if any(relpath in paths for paths in homes.values()):
                    continue
                findings.append(
                    Finding(
                        scanner="time_ownership",
                        rule="time-ownership/instant-slice",
                        path=relpath,
                        line=lineno,
                        message=(
                            "an instant's fields are sliced outside the "
                            "date/time home; read them through the home's "
                            "format family instead"
                        ),
                    )
                )
                continue
            if relpath in homes.get(family, set()):
                continue
            sanctioned = False
            for idx, entry in enumerate(SANCTIONED_COPIES):
                if (
                    entry["path"] == relpath
                    and entry["function"] == name
                    and entry["family"] == family
                ):
                    sanctioned = True
                    matched_sanctions.add(idx)
                    break
            if sanctioned:
                continue
            home = FAMILIES[family]["home"]
            findings.append(
                Finding(
                    scanner="time_ownership",
                    rule=f"time-ownership/{family}-copy",
                    path=relpath,
                    line=lineno,
                    message=(
                        f"a private {family} helper outside its home "
                        f"({home}); extend the home, or sanction the copy "
                        "in the scanner's family map with its reason"
                    ),
                )
            )
    for idx, entry in enumerate(SANCTIONED_COPIES):
        if entry["path"] in scanned and idx not in matched_sanctions:
            findings.append(
                Finding(
                    scanner="time_ownership",
                    rule="time-ownership/stale-exception",
                    path=entry["path"],
                    line=None,
                    message=(
                        "a sanctioned copy in the family map no longer "
                        "matches its family shape; remove or re-argue it"
                    ),
                )
            )
    return findings


SCANNER = Scanner(
    name="time_ownership",
    description="date/time derivations live in the one homed module per family",
    run=scan,
)
