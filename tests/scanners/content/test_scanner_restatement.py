import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.content.restatement import EXCEPTIONS, scan

LONG = (
    "The gate runs every scanner over the tracked tree before "
    "any landing is reported as done."
)


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


class RestatementScannerTests(unittest.TestCase):
    def test_sentence_restated_across_documents_is_a_finding(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "docs/a.md", f"{LONG}\n")
            write(tmp, "docs/b.md", f"{LONG}\n")
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "restatement/duplicate-sentence")
            self.assertEqual(findings[0].path, "docs/b.md")
            self.assertNotIn("gate runs every scanner", str(findings[0]))

    def test_short_repeated_sentence_is_clean(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "docs/a.md", "See the method for the full rule.\n")
            write(tmp, "docs/b.md", "See the method for the full rule.\n")
            self.assertEqual(scan(Path(tmp)), [])

    def test_fenced_duplicate_is_not_read(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "docs/a.md", f"{LONG}\n")
            write(tmp, "docs/b.md", f"```\n{LONG}\n```\n")
            self.assertEqual(scan(Path(tmp)), [])

    def test_declared_exception_is_clean(self):
        sentence = next(iter(EXCEPTIONS))
        prose = sentence.capitalize() + "."
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "docs/a.md", f"{prose}\n")
            write(tmp, "docs/b.md", f"{prose}\n")
            self.assertEqual(scan(Path(tmp)), [])

    def test_sentence_repeated_within_one_document_is_clean(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "docs/a.md", f"{LONG}\n\n{LONG}\n")
            self.assertEqual(scan(Path(tmp)), [])


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
class RestatementTrackedPopulationTests(unittest.TestCase):
    def test_only_tracked_documents_count(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            git(root, "init", "-q")
            write(root, "docs/a.md", f"{LONG}\n")
            write(root, "docs/b.md", f"{LONG}\n")
            git(root, "add", "docs/a.md", "docs/b.md")
            git(root, "commit", "-q", "-m", "seed")
            write(root, "docs/c.md", f"{LONG}\n")
            findings = scan(root)
            self.assertEqual([f.path for f in findings], ["docs/b.md"])
            git(root, "add", "docs/c.md")
            findings = scan(root)
            self.assertEqual([f.path for f in findings], ["docs/b.md", "docs/c.md"])


if __name__ == "__main__":
    unittest.main()
