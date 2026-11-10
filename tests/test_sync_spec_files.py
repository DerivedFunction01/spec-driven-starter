"""Drills for tools/sync_spec_files.py: drift is reported
in check mode, --apply copies canonical bytes over the
drifted copy, and a missing registry is a clean refusal.
"""

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "tools" / \
    "sync_spec_files.py"


def build_tree(root: Path) -> Path:
    canonical = root / "canonical"
    (canonical / "skills" / "demo").mkdir(parents=True)
    (canonical / "skills" / "demo" / "SKILL.md").write_text(
        "canonical\n", encoding="utf-8")
    repo = root / "consumer"
    (repo / "docs" / "demo").mkdir(parents=True)
    (repo / "docs" / "demo" / "SKILL.md").write_text(
        "stale\n", encoding="utf-8")
    registry = {
        "canonical_root": str(canonical),
        "targets": [{
            "name": "consumer",
            "repo": str(repo),
            "files": [
                {"source": "skills/demo/SKILL.md",
                 "dest": "docs/demo/SKILL.md"},
                {"source": "skills/demo/SKILL.md",
                 "dest": "docs/demo/ABSENT.md"},
            ],
        }],
    }
    registry_path = root / "registry.json"
    registry_path.write_text(json.dumps(registry),
                             encoding="utf-8")
    return registry_path


def run(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        capture_output=True, text=True, timeout=60)


class SyncSpecFilesTest(unittest.TestCase):
    def test_check_reports_drift_and_missing(self):
        with tempfile.TemporaryDirectory() as tmp:
            registry = build_tree(Path(tmp))
            result = run("--registry", str(registry))
            self.assertEqual(result.returncode, 1)
            self.assertIn("drift consumer:docs/demo/SKILL.md",
                          result.stdout)
            self.assertIn("missing-dest consumer:docs/demo/"
                          "ABSENT.md", result.stdout)

    def test_apply_syncs_then_check_is_clean(self):
        with tempfile.TemporaryDirectory() as tmp:
            registry = build_tree(Path(tmp))
            result = run("--registry", str(registry), "--apply")
            self.assertEqual(result.returncode, 0)
            dest = Path(tmp) / "consumer" / "docs" / "demo" / \
                "SKILL.md"
            self.assertEqual(dest.read_text(encoding="utf-8"),
                             "canonical\n")
            result = run("--registry", str(registry))
            self.assertEqual(result.returncode, 0)
            self.assertIn("2 ok", result.stdout)

    def test_missing_registry_refuses(self):
        result = run("--registry", "/nonexistent/spec-sync.json")
        self.assertEqual(result.returncode, 2)
        self.assertIn("spec-sync.example.json", result.stdout)


if __name__ == "__main__":
    unittest.main()
