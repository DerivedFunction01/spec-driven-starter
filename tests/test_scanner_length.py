import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.base import SEVERITY_ERROR, SEVERITY_NOTICE
from backend.foundation.scanners.length import CREEP_LINES, MAX_LINES, scan


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def errors(findings):
    return [f for f in findings if f.severity == SEVERITY_ERROR]


def git(root, *args):
    subprocess.run(
        [
            "git",
            "-C",
            str(root),
            "-c",
            "user.email=test@example.com",
            "-c",
            "user.name=Test",
            *args,
        ],
        check=True,
        capture_output=True,
        text=True,
    )


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

    def test_over_cap_css_under_assets_is_a_finding(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "assets/vendor.css", "a {}\n" * (MAX_LINES + 1))
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "length/file-length")

    def test_over_cap_css_outside_assets_is_a_finding(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "styles/main.css", "a {}\n" * (MAX_LINES + 1))
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "length/file-length")


@unittest.skipUnless(shutil.which("git"), "git not on PATH")
class LengthScannerGitTests(unittest.TestCase):
    def make_repo(self, tmp, lines):
        root = Path(tmp)
        git(root, "init", "-q")
        write(root, "mod.py", "x = 1\n" * lines)
        git(root, "add", "mod.py")
        git(root, "commit", "-q", "-m", "seed")
        return root

    def test_band_file_grown_past_head_errors(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = self.make_repo(tmp, CREEP_LINES + 5)
            write(root, "mod.py", "x = 1\n" * (CREEP_LINES + 10))
            findings = scan(root)
            self.assertEqual(len(errors(findings)), 1)
            self.assertEqual(errors(findings)[0].rule, "length/band-growth")

    def test_band_file_unchanged_from_head_is_notice_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = self.make_repo(tmp, CREEP_LINES + 5)
            findings = scan(root)
            self.assertEqual(errors(findings), [])
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "length/creep-band")
            self.assertEqual(findings[0].severity, SEVERITY_NOTICE)

    def test_band_file_shrunk_from_head_is_notice_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = self.make_repo(tmp, CREEP_LINES + 10)
            write(root, "mod.py", "x = 1\n" * (CREEP_LINES + 5))
            findings = scan(root)
            self.assertEqual(errors(findings), [])
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "length/creep-band")

    def test_new_band_file_not_at_head_is_notice_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = self.make_repo(tmp, 10)
            write(root, "new.py", "x = 1\n" * (CREEP_LINES + 5))
            git(root, "add", "new.py")
            findings = scan(root)
            self.assertEqual(errors(findings), [])
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "length/creep-band")
            self.assertEqual(findings[0].path, "new.py")


if __name__ == "__main__":
    unittest.main()
