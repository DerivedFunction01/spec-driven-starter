import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.security_baseline import scan

SERVER_WITH_HEADERS = '''
from http.server import BaseHTTPRequestHandler

HEADERS = {
    "Content-Security-Policy": "default-src 'self'",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
}
'''


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def scan_tree(files):
    with tempfile.TemporaryDirectory() as tmp:
        for relpath, text in files.items():
            write(tmp, relpath, text)
        return scan(Path(tmp))


class SecurityBaselineScannerTests(unittest.TestCase):
    def test_eval_call_is_a_finding(self):
        findings = scan_tree({"backend/services/x.py": "eval('1')\n"})
        self.assertEqual(
            [f.rule for f in findings], ["security-baseline/eval-call"]
        )

    def test_shell_true_is_a_finding(self):
        findings = scan_tree({"backend/infra/x.py": "run(cmd, shell=True)\n"})
        self.assertEqual(
            [f.rule for f in findings], ["security-baseline/shell-true"]
        )

    def test_server_without_headers_is_a_finding(self):
        server = "from http.server import BaseHTTPRequestHandler\n"
        findings = scan_tree({"backend/apps/server.py": server})
        rules = [f.rule for f in findings]
        self.assertEqual(rules, ["security-baseline/missing-header"] * 4)

    def test_server_with_headers_is_clean(self):
        findings = scan_tree({"backend/apps/server.py": SERVER_WITH_HEADERS})
        self.assertEqual(findings, [])

    def test_plain_code_is_clean(self):
        self.assertEqual(scan_tree({"backend/domain/x.py": "x = 1\n"}), [])


if __name__ == "__main__":
    unittest.main()
