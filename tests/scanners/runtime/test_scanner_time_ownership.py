import tempfile
import unittest
from pathlib import Path
from unittest import mock

from backend.foundation.scanners.runtime import time_ownership
from backend.foundation.scanners.runtime.time_ownership import scan


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def scan_tree(files):
    with tempfile.TemporaryDirectory() as tmp:
        for relpath, text in files.items():
            write(tmp, relpath, text)
        return scan(Path(tmp))


PARSE_COPY = (
    "from datetime import datetime\n"
    "\n"
    "\n"
    "def parse_iso(text):\n"
    "    return datetime.fromisoformat(text)\n"
)


class TimeOwnershipScannerTests(unittest.TestCase):
    def test_parse_copy_outside_home_is_a_finding(self):
        findings = scan_tree({"backend/services/stamps.py": PARSE_COPY})
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].rule, "time-ownership/parse-copy")

    def test_parse_copy_in_home_is_clean(self):
        findings = scan_tree({"backend/foundation/dates.py": PARSE_COPY})
        self.assertEqual(findings, [])

    def test_format_copy_outside_home_is_a_finding(self):
        source = "def iso(dt):\n    return dt.isoformat()\n"
        findings = scan_tree({"backend/services/stamps.py": source})
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].rule, "time-ownership/format-copy")

    def test_now_wrapper_outside_home_is_a_finding(self):
        source = (
            "from datetime import datetime, timezone\n"
            "\n"
            "\n"
            "def stamp():\n"
            "    return datetime.now(timezone.utc).isoformat()\n"
        )
        findings = scan_tree({"backend/services/stamps.py": source})
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].rule, "time-ownership/now-copy")

    def test_consumer_computation_is_clean(self):
        source = (
            "from datetime import datetime\n"
            "\n"
            "\n"
            "def is_late(text, deadline):\n"
            "    parsed = datetime.fromisoformat(text)\n"
            "    label = format(parsed, 'x')\n"
            "    print(label)\n"
            "    return parsed > deadline and len(label) > 0\n"
        )
        self.assertEqual(scan_tree({"backend/services/check.py": source}), [])

    def test_minting_inside_a_larger_function_is_clean(self):
        source = (
            "from datetime import datetime, timezone\n"
            "\n"
            "\n"
            "def build(deadline):\n"
            "    created = datetime.now(timezone.utc)\n"
            "    print(created, deadline)\n"
            "    return {'ok': created < deadline, 'n': len(str(deadline))}\n"
        )
        self.assertEqual(scan_tree({"backend/services/build.py": source}), [])

    def test_foreign_machinery_import_is_a_finding(self):
        source = "import dateutil.parser\n\n\nX = dateutil.parser\n"
        findings = scan_tree({"backend/services/stamps.py": source})
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].rule, "time-ownership/foreign-machinery")

    def test_instant_slice_is_a_finding(self):
        source = "def day(dt):\n    return dt.isoformat()[:10]\n"
        findings = scan_tree({"backend/services/stamps.py": source})
        rules = {f.rule for f in findings}
        self.assertIn("time-ownership/instant-slice", rules)

    def test_test_class_files_are_out_of_scope(self):
        findings = scan_tree({"tests/test_stamps.py": PARSE_COPY})
        self.assertEqual(findings, [])

    def test_sanctioned_copy_is_clean_and_stale_sanction_fails(self):
        entry = {
            "path": "backend/services/stamps.py",
            "function": "parse_iso",
            "family": "parse",
            "kind": "fixture sanction",
        }
        with mock.patch.object(time_ownership, "SANCTIONED_COPIES", (entry,)):
            self.assertEqual(
                scan_tree({"backend/services/stamps.py": PARSE_COPY}), []
            )
            findings = scan_tree({"backend/services/stamps.py": "X = 1\n"})
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].rule, "time-ownership/stale-exception")


if __name__ == "__main__":
    unittest.main()
