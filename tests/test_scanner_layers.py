import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.layers import scan


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


class LayersScannerTests(unittest.TestCase):
    def test_downward_imports_are_clean(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "backend/services/model.py", "import backend.domain.rules\n")
            write(tmp, "backend/apps/server.py", "import backend.services.model\n")
            write(tmp, "backend/foundation/base.py", "import backend.foundation.x\n")
            self.assertEqual(scan(Path(tmp)), [])

    def test_upward_import_is_a_finding(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "backend/domain/rules.py", "import backend.services.model\n")
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "layers/import-ranks")

    def test_foundation_importing_domain_is_a_finding(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "backend/foundation/base.py", "from backend.domain import x\n")
            self.assertEqual(len(scan(Path(tmp))), 1)

    def test_relative_upward_import_is_a_finding(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "backend/domain/rules.py", "from ..services import model\n")
            self.assertEqual(len(scan(Path(tmp))), 1)

    def test_stdlib_imports_are_ignored(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "backend/domain/rules.py", "import os\nimport json\n")
            self.assertEqual(scan(Path(tmp)), [])


if __name__ == "__main__":
    unittest.main()
