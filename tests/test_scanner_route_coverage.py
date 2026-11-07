import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.route_coverage import scan

SERVER = '''
def do_GET(self):
    if self.path == "/health":
        pass
    elif self.path == "/api/v1/model":
        pass
'''


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def scan_tree(registry_text=None, server=SERVER):
    with tempfile.TemporaryDirectory() as tmp:
        write(tmp, "backend/apps/server.py", server)
        if registry_text is not None:
            write(tmp, "spec/route-coverage.md", registry_text)
        return scan(Path(tmp))


class RouteCoverageScannerTests(unittest.TestCase):
    def test_unenrolled_route_is_a_finding(self):
        findings = scan_tree()
        rules = [f.rule for f in findings]
        self.assertEqual(rules, ["route-coverage/unenrolled"] * 2)

    def test_enrolled_routes_are_clean(self):
        findings = scan_tree("`/health`\n`/api/v1/model`\n")
        self.assertEqual(findings, [])

    def test_live_exemption_covers_route(self):
        registry = "`/health`\n" "exempt `/api/v1/model` until 2999-01-01: reason\n"
        self.assertEqual(scan_tree(registry), [])

    def test_expired_exemption_is_a_finding(self):
        registry = "`/health`\n" "exempt `/api/v1/model` until 2000-01-01: reason\n"
        findings = scan_tree(registry)
        self.assertEqual(
            [f.rule for f in findings], ["route-coverage/exemption-expired"]
        )

    def test_no_routes_no_findings(self):
        self.assertEqual(scan_tree(server="VALUE = 1\n"), [])


if __name__ == "__main__":
    unittest.main()
