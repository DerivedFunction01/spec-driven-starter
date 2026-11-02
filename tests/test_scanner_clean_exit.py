import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.clean_exit import scan


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


class CleanExitScannerTests(unittest.TestCase):
    def test_sys_exit_in_library_tier_is_a_finding(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "backend/services/model.py", "import sys\nsys.exit(1)\n")
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "clean_exit/process-exit")

    def test_bare_exit_is_a_finding(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "backend/domain/rules.py", "exit(1)\n")
            self.assertEqual(len(scan(Path(tmp))), 1)

    def test_exit_below_main_guard_is_allowed(self):
        text = 'if __name__ == "__main__":\n    raise SystemExit(main())\n'
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "backend/foundation/tool.py", text)
            self.assertEqual(scan(Path(tmp)), [])

    def test_sys_exit_below_main_guard_is_allowed(self):
        text = 'import sys\nif __name__ == "__main__":\n    sys.exit(0)\n'
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "backend/infra/tool.py", text)
            self.assertEqual(scan(Path(tmp)), [])

    def test_apps_tier_is_out_of_scope(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "backend/apps/server.py", "import sys\nsys.exit(1)\n")
            self.assertEqual(scan(Path(tmp)), [])


if __name__ == "__main__":
    unittest.main()
