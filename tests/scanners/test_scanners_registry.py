import unittest
from pathlib import Path

from backend.foundation.scanners.registry import ALL_SCANNERS

ROOT = Path(__file__).resolve().parents[2]


class ScannerRegistryTests(unittest.TestCase):
    def test_registry_is_non_empty(self):
        self.assertTrue(ALL_SCANNERS)

    def test_scanner_names_are_unique(self):
        names = [scanner.name for scanner in ALL_SCANNERS]
        self.assertEqual(len(names), len(set(names)))

    def test_every_scanner_has_a_mirror_test(self):
        for scanner in ALL_SCANNERS:
            mirrors = list(
                (ROOT / "tests" / "scanners").glob(
                    f"*/test_scanner_{scanner.name}.py"
                )
            )
            self.assertTrue(mirrors, f"missing mirror: test_scanner_{scanner.name}.py")


if __name__ == "__main__":
    unittest.main()
