"""Store contract: every store implementation passes the same suite.

Run unchanged against the memory fake and the JSON file store,
so a storage swap is proven at the port, not in the services.
"""

import tempfile
import unittest
from pathlib import Path

from backend.domain.inventory import Item, Kit
from backend.infra.store import JsonFileStore, MemoryStore

KIT = Kit(id="k1", name="Alpha", items=(Item("rope", 1, 2),))
KIT2 = Kit(id="k2", name="Beta", items=(Item("tape", 3, 3),))


def store_factories():
    tmp = tempfile.TemporaryDirectory()
    path = Path(tmp.name) / "kits.json"
    factories = {
        "memory": MemoryStore,
        "json_file": lambda: JsonFileStore(path),
    }
    return tmp, factories


class StoreContractTests(unittest.TestCase):
    def setUp(self):
        self._tmp, self._factories = store_factories()

    def tearDown(self):
        self._tmp.cleanup()

    def test_contract(self):
        for name, factory in self._factories.items():
            with self.subTest(store=name):
                store = factory()
                self.assertEqual(store.load_kits(), [])
                store.save_kits([KIT, KIT2])
                self.assertEqual(store.load_kits(), [KIT, KIT2])
                store.save_kits([KIT2])
                self.assertEqual(store.load_kits(), [KIT2])

    def test_json_file_store_persists_across_instances(self):
        _, factories = store_factories()
        factories["json_file"]().save_kits([KIT])
        self.assertEqual(factories["json_file"]().load_kits(), [KIT])


if __name__ == "__main__":
    unittest.main()
