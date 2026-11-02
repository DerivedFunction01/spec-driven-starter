import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.no_reexport import scan


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


class NoReexportScannerTests(unittest.TestCase):
    def test_docstring_only_init_is_clean(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "backend/domain/__init__.py", '"""Domain tier."""\n')
            self.assertEqual(scan(Path(tmp)), [])

    def test_import_in_init_is_a_finding(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "backend/domain/__init__.py", "from .rules import thing\n")
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "no_reexport/init-import")

    def test_import_in_plain_module_is_clean(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "backend/domain/rules.py", "import os\n")
            self.assertEqual(scan(Path(tmp)), [])


if __name__ == "__main__":
    unittest.main()
