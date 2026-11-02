"""The store seam: services depend on this interface only."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Protocol

from backend.domain.inventory import Item, Kit


class Store(Protocol):
    def load_kits(self) -> list[Kit]: ...

    def save_kits(self, kits: list[Kit]) -> None: ...


class MemoryStore:
    """In-memory store for demos and tests."""

    def __init__(self, kits: list[Kit] | None = None) -> None:
        self._kits = list(kits or [])

    def load_kits(self) -> list[Kit]:
        return list(self._kits)

    def save_kits(self, kits: list[Kit]) -> None:
        self._kits = list(kits)


class JsonFileStore:
    """JSON file store: a list of {id, name, items:[{name,have,need}]}."""

    def __init__(self, path: Path) -> None:
        self._path = Path(path)

    def load_kits(self) -> list[Kit]:
        if not self._path.is_file():
            return []
        rows = json.loads(self._path.read_text(encoding="utf-8"))
        return [
            Kit(
                id=row["id"],
                name=row["name"],
                items=tuple(
                    Item(i["name"], int(i["have"]), int(i["need"]))
                    for i in row.get("items", [])
                ),
            )
            for row in rows
        ]

    def save_kits(self, kits: list[Kit]) -> None:
        rows = [
            {
                "id": kit.id,
                "name": kit.name,
                "items": [
                    {"name": i.name, "have": i.have, "need": i.need}
                    for i in kit.items
                ],
            }
            for kit in kits
        ]
        self._path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self._path.with_suffix(".tmp")
        tmp.write_text(json.dumps(rows, indent=2), encoding="utf-8")
        tmp.replace(self._path)
