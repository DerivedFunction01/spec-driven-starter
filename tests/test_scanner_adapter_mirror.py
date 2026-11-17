import tempfile
import unittest
from pathlib import Path
from unittest import mock

from backend.foundation.scanners import adapter_mirror
from backend.foundation.scanners.adapter_mirror import scan

FULL = (
    "class Store:\n"
    "    def load_kits(self): ...\n"
    "    def save_kits(self, kits): ...\n"
    "\n"
    "\n"
    "class MemoryStore:\n"
    "    def load_kits(self):\n"
    "        return []\n"
    "    def save_kits(self, kits):\n"
    "        pass\n"
    "\n"
    "\n"
    "class JsonFileStore:\n"
    "    def load_kits(self):\n"
    "        return []\n"
    "    def save_kits(self, kits):\n"
    "        pass\n"
)

PARTIAL = FULL.replace(
    "class JsonFileStore:\n    def load_kits(self):\n        return []\n    def save_kits(self, kits):\n        pass\n",
    "class JsonFileStore:\n    def load_kits(self):\n        return []\n",
)


def scan_tree(files):
    with tempfile.TemporaryDirectory() as tmp:
        for relpath, text in files.items():
            path = Path(tmp) / relpath
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text, encoding="utf-8")
        return scan(Path(tmp))


class AdapterMirrorScannerTests(unittest.TestCase):
    def test_full_implementations_are_clean(self):
        findings = scan_tree({"backend/infra/store.py": FULL})
        self.assertEqual(findings, [])

    def test_partial_implementation_is_a_finding(self):
        findings = scan_tree({"backend/infra/store.py": PARTIAL})
        self.assertEqual(len(findings), 1)
        self.assertEqual(
            findings[0].rule, "adapter-mirror/partial-implementation"
        )
        self.assertIn("save_kits", findings[0].message)

    def test_missing_declared_module_is_a_finding(self):
        findings = scan_tree({})
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].rule, "adapter-mirror/missing-module")

    def test_unrelated_class_is_not_an_implementation(self):
        source = FULL + "\n\nclass Helper:\n    def render(self):\n        pass\n"
        self.assertEqual(scan_tree({"backend/infra/store.py": source}), [])

    def test_allowlisted_partial_is_clean(self):
        entry = {
            "module": "backend/infra/store.py",
            "class": "JsonFileStore",
            "kind": "fixture reason",
        }
        with mock.patch.object(adapter_mirror, "ALLOWLIST", (entry,)):
            self.assertEqual(scan_tree({"backend/infra/store.py": PARTIAL}), [])

    def test_stale_allowlist_entry_is_a_finding(self):
        entry = {
            "module": "backend/infra/store.py",
            "class": "JsonFileStore",
            "kind": "fixture reason",
        }
        with mock.patch.object(adapter_mirror, "ALLOWLIST", (entry,)):
            findings = scan_tree({"backend/infra/store.py": FULL})
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].rule, "adapter-mirror/stale-exception")


if __name__ == "__main__":
    unittest.main()
