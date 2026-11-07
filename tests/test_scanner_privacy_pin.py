import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.privacy_pin import scan


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def scan_tree(files):
    with tempfile.TemporaryDirectory() as tmp:
        for relpath, text in files.items():
            write(tmp, relpath, text)
        return scan(Path(tmp))


class PrivacyPinScannerTests(unittest.TestCase):
    def test_staff_field_in_services_payload_is_a_finding(self):
        body = 'def build():\n    return {"name": "x", "staff_note": "n"}\n'
        findings = scan_tree({"backend/services/model.py": body})
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].rule, "privacy-pin/staff-field-in-payload")

    def test_internal_prefix_is_a_finding(self):
        body = 'def build():\n    return {"internal_debug": 1}\n'
        findings = scan_tree({"backend/services/model.py": body})
        self.assertEqual(len(findings), 1)

    def test_public_payload_is_clean(self):
        body = 'def build():\n    return {"name": "x", "status_label": "Ready"}\n'
        self.assertEqual(scan_tree({"backend/services/model.py": body}), [])

    def test_staff_field_outside_services_is_not_this_scanners_business(self):
        body = 'RECORD = {"staff_note": "kept in the store"}\n'
        self.assertEqual(scan_tree({"backend/infra/store.py": body}), [])


if __name__ == "__main__":
    unittest.main()
