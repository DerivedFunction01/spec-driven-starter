"""Build the repo venv at var/venv; install the pinned toolchain.

Usage: python3 init_venv.py. Idempotent. Pins are read from
pyproject.toml (the one tooling seam); uv is preferred (resolved
by path, never a bare name) with a python3 -m venv fallback.
"""

from __future__ import annotations

import shutil
import subprocess
import sys
import tomllib
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent
VENV_DIR = REPO_ROOT / "var" / "venv"
PYPROJECT = REPO_ROOT / "pyproject.toml"

# uv lives outside PATH in non-login shells on this machine; check
# the documented install locations explicitly before giving up.
UV_FALLBACKS = [
    Path.home() / ".local" / "bin" / "uv",
    Path.home() / ".cargo" / "bin" / "uv",
]


def find_uv() -> str | None:
    """Resolve uv: PATH first, then the known per-user install paths."""
    found = shutil.which("uv")
    if found:
        return found
    for candidate in UV_FALLBACKS:
        if candidate.is_file():
            return str(candidate)
    return None


def venv_python() -> Path:
    """Path to the venv interpreter (POSIX layout; Linux target)."""
    return VENV_DIR / "bin" / "python"


def pinned_dependencies() -> list[str]:
    """Read the exact runtime pins out of pyproject.toml."""
    data = tomllib.loads(PYPROJECT.read_text(encoding="utf-8"))
    return list(data["project"].get("dependencies", []))


def pinned_dev_dependencies() -> list[str]:
    """Read the exact dev pins out of pyproject.toml."""
    data = tomllib.loads(PYPROJECT.read_text(encoding="utf-8"))
    return list(data["project"]["optional-dependencies"]["dev"])


def run(cmd: list[str]) -> None:
    print(f"==> {' '.join(cmd)}")
    subprocess.run(cmd, check=True)


def create_venv(uv: str | None) -> None:
    if venv_python().is_file():
        print(f"==> venv exists, reusing: {VENV_DIR}")
        return
    VENV_DIR.parent.mkdir(parents=True, exist_ok=True)
    if uv:
        # Pin uv to the current interpreter so it provisions a
        # matching CPython instead of downloading a managed one.
        run([uv, "venv", str(VENV_DIR), "--python", sys.executable])
    else:
        run([sys.executable, "-m", "venv", str(VENV_DIR)])


def install_deps(uv: str | None, packages: list[str]) -> None:
    python = str(venv_python())
    if uv:
        run([uv, "pip", "install", "--python", python, *packages])
    else:
        run([python, "-m", "pip", "install", *packages])


def main() -> int:
    uv = find_uv()
    if uv:
        version = subprocess.run(
            [uv, "--version"], capture_output=True, text=True, check=True
        ).stdout.strip()
        print(f"==> using uv: {uv} ({version})")
    else:
        print("==> uv not found; falling back to python3 -m venv + venv pip")

    packages = pinned_dependencies() + pinned_dev_dependencies()
    print(f"==> pinned dependencies: {', '.join(packages)}")

    create_venv(uv)
    install_deps(uv, packages)

    print(f"==> venv ready: {VENV_DIR}")
    print("==> gate: python3 check.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
