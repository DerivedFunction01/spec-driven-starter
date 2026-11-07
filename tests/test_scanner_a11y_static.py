import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.a11y_static import scan

GOOD_PAGE = """<!DOCTYPE html>
<html lang="en">
<body>
<img src="a.png" alt="A kit">
<label for="q">Search</label>
<input id="q" type="text">
<button>Save</button>
</body>
</html>
"""


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def scan_page(html):
    with tempfile.TemporaryDirectory() as tmp:
        write(tmp, "frontend/index.html", html)
        return scan(Path(tmp))


class A11yStaticScannerTests(unittest.TestCase):
    def test_good_page_is_clean(self):
        self.assertEqual(scan_page(GOOD_PAGE), [])

    def test_missing_lang_is_a_finding(self):
        findings = scan_page("<html><body></body></html>\n")
        self.assertIn("a11y-static/html-lang", [f.rule for f in findings])

    def test_img_without_alt_is_a_finding(self):
        page = GOOD_PAGE.replace(' alt="A kit"', "")
        findings = scan_page(page)
        self.assertEqual([f.rule for f in findings], ["a11y-static/img-alt"])

    def test_unlabeled_control_is_a_finding(self):
        page = GOOD_PAGE.replace('<label for="q">Search</label>\n', "")
        findings = scan_page(page)
        self.assertEqual(
            [f.rule for f in findings], ["a11y-static/control-name"]
        )

    def test_unnamed_button_is_a_finding(self):
        page = GOOD_PAGE.replace("<button>Save</button>", "<button></button>")
        findings = scan_page(page)
        self.assertEqual([f.rule for f in findings], ["a11y-static/button-name"])

    def test_positive_tabindex_is_a_finding(self):
        page = GOOD_PAGE.replace("<button>", '<button tabindex="3">')
        findings = scan_page(page)
        self.assertEqual([f.rule for f in findings], ["a11y-static/tabindex"])


if __name__ == "__main__":
    unittest.main()
