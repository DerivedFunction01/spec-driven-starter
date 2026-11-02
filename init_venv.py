"""Build the repo venv at var/venv; install requirements.txt.

Usage: python3 init_venv.py. Idempotent. Each repo owns its own
builder: the package spec lives here and in requirements.txt,
never in an external registry. Prefers uv (resolved by path,
never a bare name — non-login shells may lack the per-user bin
directory on PATH) and falls back to python3 -m venv + pip.
Never installs anything system-wide.
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent
VENV_DIR = REPO_ROOT / "var" / "venv"
REQUIREMENTS = REPO_ROOT / "requirements.txt"

UV_FALLBACKS = [
    Path.home() / ".local" / "bin" / "uv",
    Path.home() / ".cargo" / "bin" / "uv",
]


def find_uv() -> str | None:
    """Resolve uv: PATH first, then known per-user install paths."""
    found = shutil.which("uv")
    if found:
        return found
    for candidate in UV_FALLBACKS:
        if candidate.is_file():
            return str(candidate)
    return None


def venv_python() -> Path:
    return VENV_DIR / "bin" / "python"


def run(cmd: list[str]) -> None:
    print(f"==> {' '.join(cmd)}")
    subprocess.run(cmd, check=True)


def create_venv(uv: str | None) -> None:
    if venv_python().is_file():
        print(f"==> venv exists, reusing: {VENV_DIR}")
        return
    VENV_DIR.parent.mkdir(parents=True, exist_ok=True)
    if uv:
        run([uv, "venv", str(VENV_DIR), "--python", sys.executable])
    else:
        run([sys.executable, "-m", "venv", str(VENV_DIR)])


def install_deps(uv: str | None) -> None:
    python = str(venv_python())
    if uv:
        run([uv, "pip", "install", "--python", python,
             "-r", str(REQUIREMENTS)])
    else:
        run([python, "-m", "pip", "install", "-r", str(REQUIREMENTS)])


def main() -> int:
    uv = find_uv()
    if uv:
        print(f"==> using uv: {uv}")
    else:
        print("==> uv not found; falling back to venv + pip")
    create_venv(uv)
    install_deps(uv)
    run([str(venv_python()), "-c",
         "import backend.services.model; print('smoke: ok')"])
    print(f"==> venv ready: {VENV_DIR}")
    print("==> gate: bash check.sh")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
