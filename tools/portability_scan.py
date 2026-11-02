#!/usr/bin/env python3
"""Portability scanner (adapted for the starter from the
fleet pattern): tracked text references only what a fresh
clone resolves.

Legs, all generic and always on (a finding fails the gate):

- abs-path: absolute paths (POSIX roots for home, users,
  opt, tmp; Windows drive forms).
- home-path: home-anchored tilde paths. The sanctioned
  anchors (${REPO}, ${WS}, ${HOME}) are dollar forms, not
  tilde forms, and never fire.
- owner-name: the owner's name, any case. The name is
  carried split in this module's own source, so the literal
  appears in no tracked file, this one included.
- untracked-ref: a specific plan file under .plans/, or a
  dated home-memory log path. A bare directory-convention
  mention does not fire; a specific file inside does.

Plus one advisory leg:

- denylist: personal literals from an untracked file,
  resolved env-first (STARTER_DENYLIST_FILE), else
  var/denylist.txt when present. Absent, the leg prints
  a one-line NOTICE and skips. Findings are reported in
  their own section and fail only under --fail-on-denylist.
  The list file itself is never scanned.

Exceptions: only files named in EXCEPTION_FILES may carry
directive lines of the form

    portability-exception: <exact string> <em-dash> <reason>

where <em-dash> is a literal em-dash character. A directive exempts
that one exact matched string in that one file. A
directive-shaped line in any other file is itself a
finding, and a match in a registry file that its
directives do not name is an ordinary finding — reliance
without declaration is not an exception. Exceptions
apply to the generic legs only, never to the denylist.

Findings never print matched content: rule, path, line.

Usage: portability_scan.py [--root DIR] [--fail-on-denylist]
Exit: 0 = no failing findings; 1 = findings; 2 = usage error.
"""
import os
import re
import subprocess
import sys

SCAN_SUFFIXES = (
    ".py", ".md", ".toml", ".yaml", ".yml", ".json",
    ".ts", ".tsx", ".js", ".mjs", ".sh", ".tmpl", ".txt",
)
SCAN_NAMES = {".gitignore"}
WALK_SKIP_DIRS = {".git", "var", ".venv", ".plans", "__pycache__", "node_modules", "workbench"}

# Files that may declare portability-exception directives.
# Empty today: the tree needs none. Add a path here only
# together with the directive it relies on, in that file.
EXCEPTION_FILES = ()

_MARKER = "portability" + "-exception:"
EXCEPTION_DIRECTIVE_RE = re.compile(
    re.escape(_MARKER) + r"\s*(\S+)\s+—\s*(\S.*)$"
)

_BOUNDARY = r"(?<![\w/.-])"
_PATH_TAIL = r"[\w.-]+(?:/[\w.-]+)*"

ABS_HOME_RE = re.compile(_BOUNDARY + "/home/" + _PATH_TAIL)
ABS_USERS_RE = re.compile(_BOUNDARY + "/Users/" + _PATH_TAIL)
ABS_OPT_RE = re.compile(_BOUNDARY + "/opt/" + _PATH_TAIL)
ABS_TMP_RE = re.compile(_BOUNDARY + "/tmp/" + _PATH_TAIL)
_DRIVE_RE = re.compile(
    r"(?<![\w])[A-Za-z]" + ":" + r"\\"
    + r"|(?<=[\s\"'(=])[A-Za-z]" + ":" + "/"
)
TILDE_RE = re.compile(_BOUNDARY + r"~/[\w.-][\w./-]*")

# The owner's name, carried split so this module's own
# text never contains it; matching is case-insensitive.
OWNER_NAME_RE = re.compile("", re.IGNORECASE)

PLAN_FILE_RE = re.compile(
    r"\.plans/(?!finished/)[\w.-]+\.(?:md|json|ya?ml)"
    r"|\.plans/(?!finished/)[\w.-]+/"
    r"|\.plans/finished/[\w.-]+\.(?:md|json|ya?ml)"
)
DATED_MEMORY_RE = re.compile(_BOUNDARY + r"memory/\d{4}-\d{2}-\d{2}")

GENERIC_LEGS = (
    ("portability/abs-path", ABS_HOME_RE),
    ("portability/abs-path", ABS_USERS_RE),
    ("portability/abs-path", ABS_OPT_RE),
    ("portability/abs-path", ABS_TMP_RE),
    ("portability/abs-path", _DRIVE_RE),
    ("portability/home-path", TILDE_RE),
    ("portability/owner-name", OWNER_NAME_RE),
    ("portability/untracked-ref", PLAN_FILE_RE),
    ("portability/untracked-ref", DATED_MEMORY_RE),
)


def _scannable(relpath):
    if relpath in SCAN_NAMES:
        return True
    return relpath.endswith(SCAN_SUFFIXES)


def _tracked_files(root):
    """Repo-relative paths to scan: git's tracked set when
    git answers, else a walk with the runtime dirs skipped
    (a fresh copy may have no .git at all)."""
    try:
        out = subprocess.run(
            ["git", "-C", root, "ls-files", "--cached"],
            capture_output=True, text=True, timeout=30,
        )
        if out.returncode == 0:
            return sorted(
                p for p in out.stdout.splitlines()
                if p and _scannable(p)
                and os.path.isfile(os.path.join(root, p))
            )
    except (OSError, subprocess.SubprocessError):
        pass
    found = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in WALK_SKIP_DIRS]
        for name in filenames:
            if name.endswith(".pyc"):
                continue
            full = os.path.join(dirpath, name)
            relpath = os.path.relpath(full, root).replace(os.sep, "/")
            if _scannable(relpath):
                found.append(relpath)
    return sorted(found)


def _read_lines(path):
    try:
        with open(path, encoding="utf-8") as fh:
            return fh.read().splitlines()
    except (OSError, UnicodeDecodeError):
        return None


def _declared_exceptions(relpath, lines):
    """Exact strings this file's directives exempt — only
    registry files may declare any."""
    if relpath not in EXCEPTION_FILES:
        return set()
    found = set()
    for line in lines:
        match = EXCEPTION_DIRECTIVE_RE.search(line)
        if match:
            found.add(match.group(1))
    return found


def scan_generic(root, files):
    findings = []
    for relpath in files:
        lines = _read_lines(os.path.join(root, relpath))
        if lines is None:
            continue
        exceptions = _declared_exceptions(relpath, lines)
        for lineno, line in enumerate(lines, start=1):
            if relpath not in EXCEPTION_FILES and EXCEPTION_DIRECTIVE_RE.search(line):
                findings.append(
                    ("portability/exception-misuse", relpath, lineno)
                )
            for rule, pattern in GENERIC_LEGS:
                for match in pattern.finditer(line):
                    if match.group(0) in exceptions:
                        continue
                    findings.append((rule, relpath, lineno))
    return findings


def _denylist_path(root):
    """(path, notice) — the env var wins; a set-but-unreadable
    env path reports a NOTICE rather than falling through."""
    env = os.environ.get("STARTER_DENYLIST_FILE")
    if env:
        if os.path.isfile(env):
            return env, None
        return None, (
            "denylist: NOTICE - STARTER_DENYLIST_FILE is set but "
            "unreadable; personal-literal leg skipped"
        )
    candidate = os.path.join(root, "var", "denylist.txt")
    if os.path.isfile(candidate):
        return candidate, None
    return None, (
        "denylist: NOTICE - no denylist provisioned (env "
        "STARTER_DENYLIST_FILE or var/denylist.txt); "
        "personal-literal leg skipped"
    )


def _load_literals(path):
    literals = []
    with open(path, encoding="utf-8") as fh:
        for raw in fh:
            text = raw.strip()
            if text and not text.startswith("#"):
                literals.append(text)
    return literals


def scan_denylist(root, files):
    """(findings, notice, provisioned) — findings carry rule,
    path, line; the literal itself is never reported."""
    path, notice = _denylist_path(root)
    if path is None:
        return [], notice, False
    literals = _load_literals(path)
    list_real = os.path.realpath(path)
    findings = []
    for relpath in files:
        full = os.path.join(root, relpath)
        if os.path.realpath(full) == list_real:
            continue
        lines = _read_lines(full)
        if lines is None:
            continue
        for lineno, line in enumerate(lines, start=1):
            if any(literal in line for literal in literals):
                findings.append(("denylist/personal-literal", relpath, lineno))
    return findings, None, True


def main(argv):
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    fail_on_denylist = False
    args = list(argv)
    while args:
        arg = args.pop(0)
        if arg == "--root" and args:
            root = os.path.abspath(args.pop(0))
        elif arg == "--fail-on-denylist":
            fail_on_denylist = True
        else:
            print(f"usage: portability_scan.py [--root DIR] "
                  f"[--fail-on-denylist]", file=sys.stderr)
            return 2
    files = _tracked_files(root)
    findings = scan_generic(root, files)
    for rule, relpath, lineno in findings:
        print(f"{rule}: {relpath}:{lineno} (content withheld)")
    denylist_findings, notice, provisioned = scan_denylist(root, files)
    if notice:
        print(notice)
    if provisioned:
        for rule, relpath, lineno in denylist_findings:
            print(f"{rule}: {relpath}:{lineno} (content withheld)")
        print(f"denylist: {len(denylist_findings)} finding(s)"
              + ("" if fail_on_denylist else " (advisory)"))
    failed = bool(findings) or (fail_on_denylist and bool(denylist_findings))
    if not findings:
        print(f"portability: ok ({len(files)} files scanned)")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
