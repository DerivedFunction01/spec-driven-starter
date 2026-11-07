"""The model builder: the one place API.md semantics are computed.

Every derivation, status, and label the frontend shows is made
here and served display-ready. The enum-to-label map lives in
exactly this module (spec section 2.4).
"""

from __future__ import annotations

from backend.domain.inventory import kit_status, missing_items
from backend.foundation.settings import Settings
from backend.infra.store import Store

STATUS_LABELS = {
    "ready": "Ready",
    "low": "Low stock",
    "incomplete": "Incomplete",
}


def build_model(store: Store, settings: Settings) -> dict:
    kits = []
    ready = 0
    for kit in store.load_kits():
        status = kit_status(kit, settings.low_spare_threshold)
        if status == "ready":
            ready += 1
        kits.append(
            {
                "id": kit.id,
                "name": kit.name,
                "status": status,
                "status_label": STATUS_LABELS.get(status),
                "items": [
                    {"name": i.name, "have": i.have, "need": i.need} for i in kit.items
                ],
                "missing": missing_items(kit),
            }
        )
    return {
        "contract": "api/2",
        "generated_note": "Sample data; fiction.",
        "kits": kits,
        "totals": {"kits": len(kits), "ready": ready},
    }
