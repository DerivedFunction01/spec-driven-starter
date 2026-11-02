import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.legacy_shims import scan


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def scan_text(text):
    with tempfile.TemporaryDirectory() as tmp:
        write(tmp, "mod.py", text)
        return scan(Path(tmp))


class LegacyShimsScannerTests(unittest.TestCase):
    def test_banned_word_in_comment_is_a_finding(self):
        findings = scan_text("# kept for backward compatibility\nx = 1\n")
        self.assertTrue(any(f.rule == "legacy_shims/phrase" for f in findings))

    def test_banned_identifier_is_a_finding(self):
        findings = scan_text("def load_legacy_rows():\n    pass\n")
        self.assertTrue(any(f.rule == "legacy_shims/identifier" for f in findings))

    def test_banned_class_name_is_a_finding(self):
        findings = scan_text("class LegacyAdapter:\n    pass\n")
        self.assertTrue(any(f.rule == "legacy_shims/class-name" for f in findings))

    def test_bare_alias_binding_is_a_finding(self):
        findings = scan_text("Widget = Gadget\n")
        self.assertTrue(any(f.rule == "legacy_shims/alias" for f in findings))

    def test_plain_code_is_clean(self):
        self.assertEqual(scan_text("class Widget:\n    pass\n"), [])


if __name__ == "__main__":
    unittest.main()
