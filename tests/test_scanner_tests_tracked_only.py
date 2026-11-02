import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.tests_tracked_only import scan


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


class TestsTrackedOnlyScannerTests(unittest.TestCase):
    def test_var_reference_is_a_finding(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "tests/test_x.py", 'DATA = "var/state.json"\n')
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "tests_tracked_only/reference")

    def test_frozen_reference_is_a_finding(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "tests/test_x.py", 'DATA = "frozen/snap.json"\n')
            self.assertEqual(len(scan(Path(tmp))), 1)

    def test_tracked_fixture_reference_is_clean(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "tests/test_x.py", 'DATA = "fixtures/a.json"\n')
            self.assertEqual(scan(Path(tmp)), [])

    def test_exempt_mirror_test_names_are_skipped(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "tests/test_scanner_tracking.py", 'DATA = "var/x"\n')
            self.assertEqual(scan(Path(tmp)), [])


if __name__ == "__main__":
    unittest.main()
