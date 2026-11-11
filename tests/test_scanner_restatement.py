import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.restatement import EXCEPTIONS, scan

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


if __name__ == "__main__":
    unittest.main()
