import subprocess
import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.base import SEVERITY_NOTICE
from backend.foundation.scanners.tracking import scan


def git(root, *args):
    subprocess.run(
        ["git", "-C", str(root), *args],
        check=True,
        capture_output=True,
        text=True,
    )


class TrackingScannerTests(unittest.TestCase):
    def test_outside_a_git_checkout_is_a_notice(self):
        with tempfile.TemporaryDirectory() as tmp:
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].severity, SEVERITY_NOTICE)

    def test_tracked_var_file_is_a_finding(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            git(root, "init", "-q")
            (root / "var").mkdir()
            (root / "var" / "state.txt").write_text("x\n", encoding="utf-8")
            (root / "keep.py").write_text("x = 1\n", encoding="utf-8")
            git(root, "add", "var/state.txt", "keep.py")
            findings = scan(root)
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "tracking/var-tracked")
            self.assertEqual(findings[0].path, "var/state.txt")

    def test_clean_checkout_has_no_findings(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            git(root, "init", "-q")
            (root / "keep.py").write_text("x = 1\n", encoding="utf-8")
            git(root, "add", "keep.py")
            self.assertEqual(scan(root), [])


if __name__ == "__main__":
    unittest.main()
