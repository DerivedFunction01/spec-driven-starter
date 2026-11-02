import unittest

from backend.foundation.settings import Settings
from backend.infra.sample_data import SAMPLE_KITS
from backend.infra.store import MemoryStore
from backend.services.model import build_model


class ModelTests(unittest.TestCase):
    def setUp(self):
        self.model = build_model(MemoryStore(SAMPLE_KITS), Settings())

    def test_totals(self):
        self.assertEqual(self.model["totals"], {"kits": 3, "ready": 1})

    def test_labels_served_with_enums(self):
        by_id = {k["id"]: k for k in self.model["kits"]}
        self.assertEqual(by_id["kit-river"]["status_label"], "Ready")
        self.assertEqual(by_id["kit-trail"]["status_label"], "Low stock")
        self.assertEqual(by_id["kit-camp"]["status_label"], "Incomplete")
        self.assertEqual(
            by_id["kit-camp"]["missing"], [{"name": "Stove", "short_by": 1}]
        )

    def test_contract_version(self):
        self.assertEqual(self.model["contract"], "api/1")


if __name__ == "__main__":
    unittest.main()
