"""Root validation gate: ruff format, ruff lint, policy scanners, pytest.

One command, the same for every harness (run from the repo root):

  python3 check.py              # format check, lint, scanners, targeted pytest
  python3 check.py --all        # same, but the full test suite
  python3 check.py --fast       # format check, lint, scanners (skips tests)
  python3 check.py --scan       # policy scanners only
  python3 check.py --test       # pytest only (targeted; full with --all)
  python3 check.py --fix        # apply ruff formatting + safe lint fixes
  python3 check.py --workers 4  # pytest-xdist workers (default 2)
  python3 check.py --explain    # print the test-targeting decisions
  python3 check.py <path> ...   # explicit pytest path(s), full static legs

The gate runs under the repo venv (var/venv). If invoked with any
other interpreter it re-executes itself with the venv python; if the
venv does not exist it prints the init_venv.py instruction and exits
2. Build it with:  python3 init_venv.py

Targeted pytest (default mode): changed Python files (git status,
untracked included) map to their flat mirror tests under tests/;
changes to the scanners/checks harness, check.py, init_venv.py, or
pyproject.toml pull in the whole suite. When targeting is impossible
(git unavailable), the gate runs the full suite; a clean tree runs
no tests and exits 0.

Contract-surface scoping: a change to API.md or anything under
spec/ is a shared-contract change — the gate runs the whole suite
and says so, because every surface consuming the contract is in
scope even when only one file moved. Test-isolation proof: when
tests run, the gate hashes the real state files under var/ (the
venv excluded) before and after the suite; any difference fails
the gate even when every test passes.
"""

from __future__ import annotations

import argparse
import hashlib
import os
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent
VENV_PYTHON = REPO_ROOT / "var" / "venv" / "bin" / "python"
DEFAULT_WORKERS = 2

RUFF_TARGETS = ["backend", "check.py", "init_venv.py"]
TESTS_ROOT = "tests"

# Changes under any of these paths mean "the harness itself
# changed": run the whole suite rather than mirror-mapping.
HARNESS_PREFIXES = (
    "backend/foundation/scanners/",
    "backend/foundation/checks/",
    "check.py",
    "init_venv.py",
    "pyproject.toml",
)

# Changes under any of these paths change the shared contract:
# every consuming surface is gated, not just the file's mirror.
CONTRACT_PREFIXES = (
    "API.md",
    "spec/",
)


def ensure_venv() -> None:
    """Re-exec under the venv python, or exit 2 with the instruction."""
    if not VENV_PYTHON.is_file():
        print(
            "==> repo venv missing (var/venv). Build it first:\n"
            "      python3 init_venv.py",
            file=sys.stderr,
        )
        raise SystemExit(2)
    # sys.prefix, not the executable path: the venv python is a
    # symlink to the base interpreter, so resolved paths compare
    # equal even outside the venv; the prefix never does.
    if Path(sys.prefix).resolve() != VENV_PYTHON.parent.parent.resolve():
        os.execv(
            str(VENV_PYTHON),
            [str(VENV_PYTHON), str(Path(__file__).resolve()), *sys.argv[1:]],
        )


def run_cmd(label: str, cmd: list[str]) -> int:
    print(f"==> {label}")
    result = subprocess.run(cmd, check=False)
    return result.returncode


def run_static_legs(fix: bool) -> int:
    python = sys.executable
    if fix:
        code = run_cmd(
            "ruff format (applying)", [python, "-m", "ruff", "format", *RUFF_TARGETS]
        )
        if code:
            return code
        return run_cmd(
            "ruff lint (applying safe fixes)",
            [python, "-m", "ruff", "check", "--fix", *RUFF_TARGETS],
        )
    code = run_cmd(
        "ruff format --check",
        [python, "-m", "ruff", "format", "--check", *RUFF_TARGETS],
    )
    if code:
        return code
    return run_cmd("ruff lint", [python, "-m", "ruff", "check", *RUFF_TARGETS])


def run_scanners() -> int:
    print("==> repository policy scanners")
    from backend.foundation.checks.runner import run_all

    return run_all(REPO_ROOT)


def changed_files() -> list[str] | None:
    """Changed paths from git status (incl. untracked); None if unknown."""
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain", "-uall"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            timeout=30,
            check=False,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    if result.returncode != 0:
        return None
    paths: list[str] = []
    for line in result.stdout.splitlines():
        if len(line) < 4:
            continue
        path = line[3:].strip()
        if " -> " in path:  # rename: take the destination
            path = path.split(" -> ", 1)[1]
        paths.append(path)
    return paths


def mirror_test_for(source: str) -> str | None:
    """backend/<...>/y.py or tools/y.py -> tests/test_y.py, if it exists."""
    parts = Path(source).parts
    if parts[0] == "backend" and len(parts) >= 3:
        candidate = Path(TESTS_ROOT, f"test_{Path(parts[-1]).stem}.py")
    elif parts[0] == "tools" and len(parts) == 2:
        candidate = Path(TESTS_ROOT, f"test_{Path(parts[-1]).stem}.py")
    else:
        return None
    if (REPO_ROOT / candidate).is_file():
        return candidate.as_posix()
    return None


def targeted_tests(changed: list[str], explain: bool) -> list[str]:
    """Resolve targeted test paths from the changed-file list."""
    targets: list[str] = []
    for path in changed:
        if path.startswith(CONTRACT_PREFIXES):
            if explain:
                print(f"    contract change {path}: all surfaces (whole suite)")
            return [TESTS_ROOT]
        if path.startswith(HARNESS_PREFIXES):
            if explain:
                print(f"    harness change {path}: whole test suite")
            return [TESTS_ROOT]
        if not path.endswith(".py"):
            continue
        parts = Path(path).parts
        if len(parts) > 1 and parts[0] == TESTS_ROOT:
            if (REPO_ROOT / path).is_file():
                targets.append(path)
                if explain:
                    print(f"    test change {path}: itself")
            continue
        mirror = mirror_test_for(path)
        if mirror:
            targets.append(mirror)
            if explain:
                print(f"    source change {path}: mirror {mirror}")
        elif explain:
            print(f"    source change {path}: no mirror test")
    return sorted(set(targets))


def state_snapshot() -> dict[str, str]:
    """Hashes of the real state files under var/ (venv excluded).

    The isolation proof compares snapshots around the suite: a
    difference means a test touched real state.
    """
    snapshot: dict[str, str] = {}
    var = REPO_ROOT / "var"
    if not var.is_dir():
        return snapshot
    for path in sorted(var.rglob("*")):
        if not path.is_file():
            continue
        relative = path.relative_to(var)
        if relative.parts and relative.parts[0] == "venv":
            continue
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        snapshot[path.relative_to(REPO_ROOT).as_posix()] = digest
    return snapshot


def run_tests_isolated(
    explicit_paths: list[str], force_all: bool, explain: bool, workers: int
) -> int:
    """Run pytest wrapped in the test-isolation proof."""
    before = state_snapshot()
    code = run_tests(explicit_paths, force_all, explain, workers)
    after = state_snapshot()
    if before != after:
        changed = sorted(
            path
            for path in set(before) | set(after)
            if before.get(path) != after.get(path)
        )
        print("==> test-isolation proof FAILED: the suite changed real state")
        for path in changed:
            print(f"    state changed: {path}")
        return code or 1
    if before:
        print(f"==> test-isolation proof ok ({len(before)} state file(s))")
    return code


def run_tests(
    explicit_paths: list[str], force_all: bool, explain: bool, workers: int
) -> int:
    python = sys.executable
    if explicit_paths:
        test_paths = explicit_paths
        label = "explicit pytest targets"
    elif force_all:
        test_paths = [TESTS_ROOT]
        label = "full pytest suite"
    else:
        changed = changed_files()
        if changed is None:
            print("==> git targeting unavailable; running full suite")
            test_paths = [TESTS_ROOT]
            label = "full pytest suite"
        elif not changed:
            print("==> working tree clean; no targeted tests (use --all for full)")
            return 0
        else:
            resolved = targeted_tests(changed, explain)
            if not resolved:
                print("==> no tests affected by the changed files")
                return 0
            test_paths = resolved
            label = f"targeted pytest ({len(test_paths)} path(s))"

    cmd = [python, "-m", "pytest"]
    if workers >= 2:
        cmd += ["-n", str(workers)]
    cmd += test_paths
    return run_cmd(label, cmd)


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--fix", action="store_true", help="apply ruff fixes and exit")
    mode.add_argument("--fast", action="store_true", help="static legs + scanners only")
    mode.add_argument("--scan", action="store_true", help="policy scanners only")
    mode.add_argument("--test", action="store_true", help="pytest only")
    parser.add_argument("--all", action="store_true", help="full test suite")
    parser.add_argument(
        "--workers",
        type=int,
        default=DEFAULT_WORKERS,
        help=f"pytest-xdist workers (default {DEFAULT_WORKERS})",
    )
    parser.add_argument(
        "--explain", action="store_true", help="print test-targeting decisions"
    )
    parser.add_argument("paths", nargs="*", help="explicit pytest path(s)")
    args = parser.parse_args()

    ensure_venv()

    if args.fix:
        code = run_static_legs(fix=True)
        if code == 0:
            print("==> fixes applied")
        return code
    if args.scan:
        return run_scanners()
    if args.test:
        return run_tests_isolated(args.paths, args.all, args.explain, args.workers)

    code = run_static_legs(fix=False)
    if code:
        return code
    code = run_scanners()
    if code:
        return code
    if args.fast:
        print("==> fast check passed (tests skipped)")
        return 0
    return run_tests_isolated(args.paths, args.all, args.explain, args.workers)


if __name__ == "__main__":
    raise SystemExit(main())
