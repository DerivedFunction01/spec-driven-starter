"""Ops values: the settings seam, printed for the shell.

The ops/ scripts run this module and eval its KEY=VALUE lines:
app values (host, port, unit name) from Settings; root,
interpreter, and home from the process running it.
"""

from __future__ import annotations

import shlex
import sys
from pathlib import Path

from backend.foundation.settings import REPO_ROOT, Settings


def main() -> int:
    settings = Settings.from_env()
    values = {
        "ROOT": str(REPO_ROOT),
        "PYTHON": sys.executable,
        "HOME": str(Path.home()),
        "HOST": settings.host,
        "PORT": str(settings.port),
        "UNIT": settings.unit_name,
    }
    for key, value in values.items():
        print(f"{key}={shlex.quote(value)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
