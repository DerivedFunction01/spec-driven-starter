"""Fictional seed data for the sample domain. Invented for the
starter; it describes no real club, place, or person."""

from __future__ import annotations

from backend.domain.inventory import Item, Kit

SAMPLE_KITS: list[Kit] = [
    Kit(
        id="kit-river",
        name="River Day Kit",
        items=(
            Item("Dry bag", have=6, need=4),
            Item("Safety whistle", have=8, need=4),
        ),
    ),
    Kit(
        id="kit-trail",
        name="Trail Repair Kit",
        items=(
            Item("Patch roll", have=5, need=4),
            Item("Mini pump", have=4, need=4),
        ),
    ),
    Kit(
        id="kit-camp",
        name="Camp Kitchen Kit",
        items=(
            Item("Stove", have=1, need=2),
            Item("Fuel canister", have=3, need=3),
        ),
    ),
]
