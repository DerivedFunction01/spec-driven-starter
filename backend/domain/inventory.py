"""Pure domain rules for field-kit inventory (spec/backend/02-domain).

Plain types in, plain values out. The same input always gives
the same output; labels are NOT decided here — the model builder
(services layer) owns the enum-to-label mapping.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Item:
    name: str
    have: int
    need: int


@dataclass(frozen=True)
class Kit:
    id: str
    name: str
    items: tuple[Item, ...] = field(default_factory=tuple)


def missing_items(kit: Kit) -> list[dict]:
    """Every short item with its shortfall (spec section 2.2)."""
    return [
        {"name": item.name, "short_by": item.need - item.have}
        for item in kit.items
        if item.have < item.need
    ]


def kit_status(kit: Kit, low_spare_threshold: int = 1) -> str | None:
    """One status per kit (spec section 2.3); None when uncaptured."""
    if not kit.items:
        return None
    if missing_items(kit):
        return "incomplete"
    if any(
        item.have - item.need <= low_spare_threshold for item in kit.items
    ):
        return "low"
    return "ready"
