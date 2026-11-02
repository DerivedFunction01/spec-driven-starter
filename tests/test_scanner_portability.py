import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.portability import scan

OWNER_NAME = "Den" + "ny"


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def rules(findings):
    return sorted({finding.rule for finding in findings})


class PortabilityScannerTests(unittest.TestCase):
    def scan_text(self, text, relpath="note.md"):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, relpath, text)
            return scan(Path(tmp))

    def test_clean_text_passes(self):
        findings = self.scan_text("kits live in backend/domain\n")
        self.assertEqual(findings, [])

    def test_absolute_home_path_is_a_finding(self):
        findings = self.scan_text("see " + "/h" + "ome/someone/x.py\n")
        self.assertEqual(rules(findings), ["portability/abs-path"])

    def test_tilde_path_is_a_finding(self):
        findings = self.scan_text("config at ~/private.yaml\n")
        self.assertEqual(rules(findings), ["portability/home-path"])

    def test_owner_name_is_a_finding(self):
        findings = self.scan_text(f"maintained by {OWNER_NAME}\n")
        self.assertEqual(rules(findings), ["portability/owner-name"])

    def test_specific_plan_file_is_a_finding(self):
        findings = self.scan_text("see .plans/2026-01-01-example.md\n")
        self.assertEqual(rules(findings), ["portability/untracked-ref"])

    def test_bare_plans_directory_mention_is_clean(self):
        findings = self.scan_text("plans live under .plans/ here\n")
        self.assertEqual(findings, [])

    def test_dated_memory_log_is_a_finding(self):
        findings = self.scan_text("logged in memory/2026-01-01\n")
        self.assertEqual(rules(findings), ["portability/untracked-ref"])

    def test_windows_drive_path_is_a_finding(self):
        findings = self.scan_text("path " + "C:" + "\\" + "work\n")
        self.assertEqual(rules(findings), ["portability/abs-path"])

    def test_findings_never_print_matched_content(self):
        findings = self.scan_text(f"maintained by {OWNER_NAME}\n")
        for finding in findings:
            self.assertNotIn(OWNER_NAME, finding.message)


if __name__ == "__main__":
    unittest.main()
