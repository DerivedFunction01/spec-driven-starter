import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from backend.foundation.scanners import length
from backend.foundation.scanners.base import SEVERITY_ERROR, SEVERITY_NOTICE
from backend.foundation.scanners.length import CREEP_LINES, MAX_LINES, scan


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def errors(findings):
    return [f for f in findings if f.severity == SEVERITY_ERROR]


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
            self.assertEqual(errors(scan(Path(tmp))), [])

    def test_frontend_script_over_cap_is_a_finding(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "frontend/app.js", "let x = 1;\n" * (MAX_LINES + 1))
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].path, "frontend/app.js")

    def test_band_file_is_notice_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "mod.py", "x = 1\n" * (CREEP_LINES + 10))
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "length/creep-band")
            self.assertEqual(findings[0].severity, SEVERITY_NOTICE)
            self.assertEqual(errors(findings), [])

    def test_band_file_grown_past_register_count_errors(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "mod.py", "x = 1\n" * (CREEP_LINES + 10))
            register = (("mod.py", CREEP_LINES + 5),)
            with patch.object(length, "REGISTER", register):
                findings = scan(Path(tmp))
            self.assertEqual(len(errors(findings)), 1)
            self.assertEqual(errors(findings)[0].rule, "length/register-growth")

    def test_register_shrunk_but_in_band_errors(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "mod.py", "x = 1\n" * (CREEP_LINES + 10))
            register = (("mod.py", CREEP_LINES + 50),)
            with patch.object(length, "REGISTER", register):
                findings = scan(Path(tmp))
            self.assertEqual(len(errors(findings)), 1)
            self.assertEqual(errors(findings)[0].rule, "length/register-stale")

    def test_register_entry_below_band_errors(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "mod.py", "x = 1\n" * 100)
            register = (("mod.py", CREEP_LINES + 50),)
            with patch.object(length, "REGISTER", register):
                findings = scan(Path(tmp))
            self.assertEqual(len(errors(findings)), 1)
            self.assertEqual(errors(findings)[0].rule, "length/register-stale")

    def test_register_entry_for_missing_file_errors(self):
        with tempfile.TemporaryDirectory() as tmp:
            register = (("ghost.py", CREEP_LINES + 50),)
            with patch.object(length, "REGISTER", register):
                findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "length/register-stale")
            self.assertEqual(findings[0].path, "ghost.py")

    def test_registered_over_cap_at_recorded_count_is_notice_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "mod.py", "x = 1\n" * (MAX_LINES + 100))
            register = (("mod.py", MAX_LINES + 100),)
            with patch.object(length, "REGISTER", register):
                findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "length/registered-over-cap")
            self.assertEqual(findings[0].severity, SEVERITY_NOTICE)
            self.assertEqual(errors(findings), [])

    def test_registered_suite_growth_errors(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "tests/test_widget.py", "x = 1\n" * (CREEP_LINES + 10))
            register = (("tests/test_widget.py", CREEP_LINES + 5),)
            with patch.object(length, "REGISTER", register):
                findings = scan(Path(tmp))
            self.assertEqual(len(errors(findings)), 1)
            self.assertEqual(errors(findings)[0].rule, "length/register-growth")

    def test_suite_in_band_is_clean(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "tests/test_widget.py", "x = 1\n" * (CREEP_LINES + 10))
            self.assertEqual(scan(Path(tmp)), [])

    def test_support_file_in_band_is_notice(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "tests/conftest.py", "x = 1\n" * (CREEP_LINES + 10))
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "length/creep-band")
            self.assertEqual(findings[0].severity, SEVERITY_NOTICE)

    def test_over_cap_tsx_is_a_finding(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "ui/Widget.tsx", "let x = 1;\n" * (MAX_LINES + 1))
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "length/file-length")
            self.assertEqual(findings[0].severity, SEVERITY_ERROR)

    def test_over_cap_css_under_assets_is_clean(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "assets/vendor.css", "a {}\n" * (MAX_LINES + 1))
            self.assertEqual(scan(Path(tmp)), [])

    def test_over_cap_css_outside_assets_is_a_finding(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "styles/main.css", "a {}\n" * (MAX_LINES + 1))
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "length/file-length")


if __name__ == "__main__":
    unittest.main()
