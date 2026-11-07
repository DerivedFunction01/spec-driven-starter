import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.port_boundary import scan


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def scan_tree(files):
    with tempfile.TemporaryDirectory() as tmp:
        for relpath, text in files.items():
            write(tmp, relpath, text)
        return scan(Path(tmp))


class PortBoundaryScannerTests(unittest.TestCase):
    def test_provider_name_in_plain_code_is_a_finding(self):
        findings = scan_tree({"backend/services/pay.py": "import stripe\n"})
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].rule, "port-boundary/provider-string")

    def test_provider_name_in_vendors_module_is_clean(self):
        findings = scan_tree({"backend/infra/vendors/stripe_adapter.py": "x = 1\n"})
        self.assertEqual(findings, [])

    def test_plain_code_is_clean(self):
        self.assertEqual(scan_tree({"backend/services/model.py": "x = 1\n"}), [])

    def test_provider_name_in_frontend_script_is_a_finding(self):
        findings = scan_tree({"frontend/app.js": "const key = 'twilio';\n"})
        self.assertEqual(len(findings), 1)


if __name__ == "__main__":
    unittest.main()
