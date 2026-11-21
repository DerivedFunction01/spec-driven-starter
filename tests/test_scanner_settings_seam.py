import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.settings_seam import scan


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


class SettingsSeamScannerTests(unittest.TestCase):
    def test_settings_module_may_read_environment(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "backend/foundation/settings.py", "import os\nos.environ\n")
            self.assertEqual(scan(Path(tmp)), [])

    def test_environ_outside_settings_is_a_finding(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "backend/services/model.py", "import os\nos.environ\n")
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "settings_seam/env-access")

    def test_getenv_and_from_import_are_findings(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "backend/infra/store.py", "from os import getenv\n")
            write(tmp, "backend/domain/rules.py", "import os\nos.getenv('X')\n")
            self.assertEqual(len(scan(Path(tmp))), 2)

    def test_dotenv_import_is_a_finding(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "backend/apps/server.py", "import dotenv\n")
            self.assertEqual(len(scan(Path(tmp))), 1)

    def test_denylist_scanner_is_the_named_exemption(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = "backend/foundation/scanners/denylist.py"
            write(tmp, path, "import os\nos.environ\n")
            self.assertEqual(scan(Path(tmp)), [])


if __name__ == "__main__":
    unittest.main()
