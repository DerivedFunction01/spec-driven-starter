import unittest

from backend.domain.inventory import Item, Kit, kit_status, missing_items


class DomainTests(unittest.TestCase):
    def test_missing_and_incomplete(self):
        kit = Kit("k", "K", (Item("Stove", have=1, need=2),))
        self.assertEqual(missing_items(kit), [{"name": "Stove", "short_by": 1}])
        self.assertEqual(kit_status(kit), "incomplete")

    def test_low_when_only_spare_is_at_threshold(self):
        kit = Kit("k", "K", (Item("Pump", have=5, need=4),))
        self.assertEqual(kit_status(kit, low_spare_threshold=1), "low")

    def test_ready(self):
        kit = Kit("k", "K", (Item("Bag", have=8, need=4),))
        self.assertEqual(kit_status(kit), "ready")

    def test_uncaptured_kit_status_is_none(self):
        self.assertIsNone(kit_status(Kit("k", "K", ())))


if __name__ == "__main__":
    unittest.main()
