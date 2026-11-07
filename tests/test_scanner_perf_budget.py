import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.base import SEVERITY_NOTICE
from backend.foundation.scanners.perf_budget import scan


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def scan_tree(files):
    with tempfile.TemporaryDirectory() as tmp:
        for relpath, text in files.items():
            write(tmp, relpath, text)
        return scan(Path(tmp))


class PerfBudgetScannerTests(unittest.TestCase):
    def test_under_budget_is_clean(self):
        findings = scan_tree(
            {
                "frontend/app.js": "x".join(["a"] * 100),
                "frontend/budgets.json": '{"budgets": {"script_kb": 16}, "vitals": {"lcp_s": 2.5, "inp_ms": 200, "cls": 0.1}}',
            }
        )
        self.assertEqual(findings, [])

    def test_over_budget_is_a_finding(self):
        findings = scan_tree(
            {
                "frontend/app.js": "a" * 4096,
                "frontend/budgets.json": '{"budgets": {"script_kb": 1}, "vitals": {"lcp_s": 2.5, "inp_ms": 200, "cls": 0.1}}',
            }
        )
        self.assertEqual(
            [f.rule for f in findings], ["perf-budget/over-budget"]
        )

    def test_missing_budget_file_is_a_notice_not_a_failure(self):
        findings = scan_tree({"frontend/app.js": "a"})
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].severity, SEVERITY_NOTICE)
        self.assertEqual(findings[0].rule, "perf-budget/unconfigured")

    def test_no_frontend_is_clean(self):
        self.assertEqual(scan_tree({"backend/x.py": "x = 1\n"}), [])

    def test_missing_vitals_is_a_finding(self):
        findings = scan_tree(
            {
                "frontend/app.js": "a",
                "frontend/budgets.json": '{"budgets": {"script_kb": 16}}',
            }
        )
        self.assertEqual(
            [f.rule for f in findings],
            ["perf-budget/vitals-unconfigured"] * 3,
        )


if __name__ == "__main__":
    unittest.main()
