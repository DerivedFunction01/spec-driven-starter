import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.content.living_dates import scan

ISO = "2026" + "-11" + "-23"


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def rules(findings):
    return sorted({finding.rule for finding in findings})


class LivingDatesScannerTests(unittest.TestCase):
    def scan_tree(self, files):
        with tempfile.TemporaryDirectory() as tmp:
            for relpath, text in files.items():
                write(tmp, relpath, text)
            return scan(Path(tmp))

    def test_dated_python_comment_fails(self):
        findings = self.scan_tree({"mod.py": f"# cache warmed on {ISO}\nx = 1\n"})
        self.assertEqual(rules(findings), ["living-dates/iso-date"])
        self.assertEqual(findings[0].line, 1)

    def test_dated_docstring_fails(self):
        text = f'"""Behaviour as of {ISO}."""\n\nx = 1\n'
        findings = self.scan_tree({"mod.py": text})
        self.assertEqual(rules(findings), ["living-dates/iso-date"])

    def test_dated_doc_line_fails(self):
        findings = self.scan_tree({"note.md": f"Shipped in November 2026.\n"})
        self.assertEqual(rules(findings), ["living-dates/month-date"])

    def test_date_parenthetical_fails(self):
        findings = self.scan_tree({"note.md": "the old behaviour (2026) is gone\n"})
        self.assertEqual(rules(findings), ["living-dates/date-parenthetical"])

    def test_dated_script_comment_fails(self):
        files = {"app.ts": f"// warmed on {ISO}\nexport const x = 1\n"}
        findings = self.scan_tree(files)
        self.assertEqual(rules(findings), ["living-dates/iso-date"])

    def test_date_string_literal_in_code_passes(self):
        text = f'STAMP = "{ISO}"\n\n\ndef stamp():\n    return STAMP\n'
        findings = self.scan_tree({"mod.py": text})
        self.assertEqual(findings, [])

    def test_date_string_literal_in_script_passes(self):
        findings = self.scan_tree({"app.ts": f'export const STAMP = "{ISO}"\n'})
        self.assertEqual(findings, [])

    def test_fixture_specimen_date_passes(self):
        files = {
            "fixtures/specimen.py": f'ROWS = [{{"day": "{ISO}", "amount": 3}}]\n',
            "fixtures/specimens.json": f'{{"day": "{ISO}"}}\n',
        }
        findings = self.scan_tree(files)
        self.assertEqual(findings, [])

    def test_archive_paths_pass(self):
        files = {
            ".plans/finished/old-plan.md": f"ruled on {ISO}\n",
            "run-logs/gate.md": f"gate ran {ISO}\n",
            f"logs/{ISO}/run.md": f"run of {ISO}\n",
        }
        findings = self.scan_tree(files)
        self.assertEqual(findings, [])

    def test_clean_tree_passes(self):
        files = {
            "note.md": "the cache warms before the gate reads it\n",
            "mod.py": "# the cache warms first\nx = 1\n",
            "app.ts": "/* the cache warms first */\nexport const x = 1\n",
        }
        findings = self.scan_tree(files)
        self.assertEqual(findings, [])

    def test_findings_never_print_matched_content(self):
        findings = self.scan_tree({"note.md": f"shipped {ISO}\n"})
        self.assertTrue(findings)
        for finding in findings:
            self.assertNotIn(ISO, finding.message)


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
class LivingDatesTrackedPopulationTests(unittest.TestCase):
    def test_only_tracked_files_are_scanned(self):
        dated = f"shipped {ISO}\n"
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            git(root, "init", "-q")
            write(root, "tracked.md", dated)
            git(root, "add", "tracked.md")
            git(root, "commit", "-q", "-m", "seed")
            write(root, "untracked.md", dated)
            findings = scan(root)
            self.assertEqual({f.path for f in findings}, {"tracked.md"})
            git(root, "add", "untracked.md")
            findings = scan(root)
            self.assertEqual({f.path for f in findings}, {"tracked.md", "untracked.md"})


if __name__ == "__main__":
    unittest.main()
