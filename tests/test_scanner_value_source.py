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


if __name__ == "__main__":
    unittest.main()
