"""The settings seam, enforced: no backend module outside
foundation/settings.py reads the environment."""

import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class SettingsSeamTests(unittest.TestCase):
    def test_only_settings_reads_environ(self):
        offenders = []
        for path in sorted((ROOT / "backend").rglob("*.py")):
            if path.name == "settings.py":
                continue
            # The denylist scanner is the gate harness's own seam.
            rel = path.relative_to(ROOT).as_posix()
            if rel == "backend/foundation/scanners/denylist.py":
                continue
            if "os.environ" in path.read_text(encoding="utf-8"):
                offenders.append(str(path.relative_to(ROOT)))
        self.assertEqual(offenders, [])


if __name__ == "__main__":
    unittest.main()
