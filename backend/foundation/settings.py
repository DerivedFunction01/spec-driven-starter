"""The settings seam: the ONLY module that reads the environment.

Every machine assumption (host, port, unit name, data path,
thresholds) resolves here, once, into a frozen Settings object.
All other modules receive values; defaults let a fresh clone run.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]


@dataclass(frozen=True)
class Settings:
    host: str = "127.0.0.1"
    port: int = 8797
    unit_name: str = "field-kit"
    data_path: Path | None = None  # None -> seeded memory store
    low_spare_threshold: int = 1

    @classmethod
    def from_env(cls) -> Settings:
        data = os.environ.get("FIELDKIT_DATA", "")
        return cls(
            host=os.environ.get("FIELDKIT_HOST", "127.0.0.1"),
            port=int(os.environ.get("FIELDKIT_PORT", "8797")),
            unit_name=os.environ.get("FIELDKIT_UNIT", "field-kit"),
            data_path=Path(data) if data else None,
            low_spare_threshold=int(os.environ.get("FIELDKIT_LOW_SPARE", "1")),
        )
