import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.length import MAX_LINES, scan


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


class LengthScannerTests(unittest.TestCase):
    def test_over_cap_python_file_is_a_finding(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "mod.py", "x = 1\n" * (MAX_LINES + 1))
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "length/file-length")

    def test_at_cap_is_clean(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "mod.py", "x = 1\n" * MAX_LINES)
            self.assertEqual(scan(Path(tmp)), [])

    def test_frontend_script_over_cap_is_a_finding(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "frontend/app.js", "let x = 1;\n" * (MAX_LINES + 1))
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].path, "frontend/app.js")


if __name__ == "__main__":
    unittest.main()
