import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.prose_length import scan


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def scan_text(text, relpath="mod.py"):
    with tempfile.TemporaryDirectory() as tmp:
        write(tmp, relpath, text)
        return scan(Path(tmp))


class ProseLengthScannerTests(unittest.TestCase):
    def test_module_docstring_over_cap_is_a_finding(self):
        text = '"""One.\n\nTwo.\nThree.\nFour.\nFive.\n"""\n'
        findings = scan_text(text)
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].rule, "prose_length/module-docstring")

    def test_module_docstring_at_cap_is_clean(self):
        text = '"""One.\n\nTwo.\nThree.\nFour.\n"""\n'
        self.assertEqual(scan_text(text), [])

    def test_def_docstring_over_cap_is_a_finding(self):
        text = 'def f():\n    """One.\n\n    Two.\n    Three.\n    Four.\n    """\n'
        findings = scan_text(text)
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].rule, "prose_length/def-docstring")

    def test_comment_block_over_cap_is_a_finding(self):
        text = "# one\n# two\n# three\n# four\nx = 1\n"
        findings = scan_text(text)
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].rule, "prose_length/comment-block")

    def test_trailing_comments_do_not_form_a_block(self):
        text = "x = 1  # a\ny = 2  # b\nz = 3  # c\nw = 4  # d\n"
        self.assertEqual(scan_text(text), [])

    def test_check_py_module_docstring_is_exempt(self):
        text = '"""One.\n\nTwo.\nThree.\nFour.\nFive.\nSix.\n"""\n'
        self.assertEqual(scan_text(text, relpath="check.py"), [])


if __name__ == "__main__":
    unittest.main()
