"""The settings seam, enforced: no backend module outside
foundation/settings.py reads the environment."""

import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


class SettingsSeamTests(unittest.TestCase):
    def test_only_settings_reads_environ(self):
        offenders = []
        for path in sorted((ROOT / "backend").rglob("*.py")):
            if path.name == "settings.py":
                continue
            # The provisioning scanners are the gate harness's own seams.
            rel = path.relative_to(ROOT).as_posix()
            if rel in (
                "backend/foundation/scanners/content/denylist.py",
                "backend/foundation/scanners/content/portability.py",
            ):
                continue
            if "os.environ" in path.read_text(encoding="utf-8"):
                offenders.append(str(path.relative_to(ROOT)))
        self.assertEqual(offenders, [])


if __name__ == "__main__":
    unittest.main()
