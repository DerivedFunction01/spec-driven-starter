import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.value_source import scan


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def scan_tree(files):
    with tempfile.TemporaryDirectory() as tmp:
        for relpath, text in files.items():
            write(tmp, relpath, text)
        return scan(Path(tmp))


class ValueSourceScannerTests(unittest.TestCase):
    def test_clean_docs_pass(self):
        findings = scan_tree(
            {"docs/guide.md": "Files stay under the gate's length cap.\n"}
        )
        self.assertEqual(findings, [])

    def test_restated_cap_is_a_finding(self):
        findings = scan_tree({"docs/guide.md": "No file exceeds 800 lines.\n"})
        self.assertEqual([f.rule for f in findings], ["value-source/restated-cap"])

    def test_restated_folder_cap_is_a_finding(self):
        findings = scan_tree({"docs/guide.md": "Folders hold at most 20 files.\n"})
        self.assertEqual(
            [f.rule for f in findings], ["value-source/restated-folder-density"]
        )

    def test_restated_folder_band_is_a_finding(self):
        text = "The folder density band starts at 16 files per folder.\n"
        findings = scan_tree({"docs/guide.md": text})
        self.assertEqual(
            [f.rule for f in findings], ["value-source/restated-folder-density"]
        )

    def test_folder_words_and_unrelated_counts_pass(self):
        text = "Folders group files by intent; the gate runs 20 shards.\n"
        findings = scan_tree({"docs/guide.md": text})
        self.assertEqual(findings, [])

    def test_restated_vitals_is_a_finding(self):
        findings = scan_tree({"docs/guide.md": "Field target: LCP ≤ 2.5 s.\n"})
        self.assertEqual([f.rule for f in findings], ["value-source/restated-vitals"])

    def test_vitals_names_without_values_pass(self):
        findings = scan_tree(
            {"docs/guide.md": "Thresholds (LCP, INP, CLS) live in budgets.\n"}
        )
        self.assertEqual(findings, [])

    def test_readme_keeps_one_port_literal(self):
        findings = scan_tree({"README.md": "curl http://127.0.0.1:8797/health\n"})
        self.assertEqual(findings, [])

    def test_second_readme_port_is_a_finding(self):
        text = "curl http://127.0.0.1:8797/health\ncurl http://127.0.0.1:8797/\n"
        findings = scan_tree({"README.md": text})
        self.assertEqual([f.rule for f in findings], ["value-source/restated-port"])

    def test_port_in_other_docs_is_a_finding(self):
        findings = scan_tree({"docs/guide.md": "It binds port 8797 by default.\n"})
        self.assertEqual([f.rule for f in findings], ["value-source/restated-port"])


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


@unittest.skipUnless(shutil.which("git"), "git not on PATH")
class ValueSourceTrackedPopulationTests(unittest.TestCase):
    def test_only_tracked_documents_are_scanned(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            git(root, "init", "-q")
            write(root, "docs/tracked.md", "No file exceeds 800 lines.\n")
            git(root, "add", "docs/tracked.md")
            git(root, "commit", "-q", "-m", "seed")
            write(root, "docs/untracked.md", "No file exceeds 800 lines.\n")
            findings = scan(root)
            self.assertEqual({f.path for f in findings}, {"docs/tracked.md"})
            git(root, "add", "docs/untracked.md")
            findings = scan(root)
            self.assertEqual(
                {f.path for f in findings},
                {"docs/tracked.md", "docs/untracked.md"},
            )


if __name__ == "__main__":
    unittest.main()
