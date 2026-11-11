"""Drills for the fragment kind in tools/sync_spec_files.py:
byte-exact replace, idempotent apply, and distinct findings
for a drifted block and a missing marker pair."""

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "tools" / \
    "sync_spec_files.py"
BEGIN = "<!-- spec-sync:supervision-rules -->"
END = "<!-- /spec-sync:supervision-rules -->"
FRAGMENT = "\nManaged rule one.\nManaged rule two.\n"
TARGET_HEAD = "# Agent rules\n\nLocal intro stays.\n"
TARGET_TAIL = "\nLocal residue stays.\n"


def build_tree(root: Path, target_text: str,
               include_whole: bool = False) -> Path:
    canonical = root / "canonical"
    (canonical / "docs").mkdir(parents=True)
    (canonical / "docs" / "fragment.md").write_text(
        FRAGMENT, encoding="utf-8")
    (canonical / "docs" / "whole.md").write_text(
        "canonical whole\n", encoding="utf-8")
    repo = root / "consumer"
    repo.mkdir(parents=True)
    (repo / "AGENTS.md").write_text(target_text, encoding="utf-8")
    (repo / "WHOLE.md").write_text(
        "stale whole\n", encoding="utf-8")
    files = [{"source": "docs/fragment.md", "dest": "AGENTS.md",
              "kind": "fragment", "marker": "supervision-rules"}]
    if include_whole:
        files.append({"source": "docs/whole.md",
                      "dest": "WHOLE.md"})
    registry = {
        "canonical_root": str(canonical),
        "targets": [{"name": "consumer", "repo": str(repo),
                     "files": files}],
    }
    registry_path = root / "registry.json"
    registry_path.write_text(json.dumps(registry),
                             encoding="utf-8")
    return registry_path


def run(*args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        capture_output=True, text=True, timeout=60)


def drifted_target() -> str:
    return (TARGET_HEAD + BEGIN + "\nOld rule.\n" + END
            + TARGET_TAIL)


def synced_target() -> str:
    return TARGET_HEAD + BEGIN + FRAGMENT + END + TARGET_TAIL


class SyncFragmentTest(unittest.TestCase):
    def test_drifted_block_reported_then_repaired_byte_exact(self):
        with tempfile.TemporaryDirectory() as tmp:
            registry = build_tree(Path(tmp), drifted_target())
            result = run("--registry", str(registry))
            self.assertEqual(result.returncode, 1)
            self.assertIn("fragment-drift consumer:AGENTS.md",
                          result.stdout)
            self.assertNotIn("missing-markers", result.stdout)
            result = run("--registry", str(registry), "--apply")
            self.assertEqual(result.returncode, 0)
            dest = Path(tmp) / "consumer" / "AGENTS.md"
            self.assertEqual(dest.read_bytes(),
                             synced_target().encode("utf-8"))

    def test_apply_twice_is_idempotent(self):
        with tempfile.TemporaryDirectory() as tmp:
            registry = build_tree(Path(tmp), drifted_target())
            first = run("--registry", str(registry), "--apply")
            self.assertEqual(first.returncode, 0)
            second = run("--registry", str(registry), "--apply")
            self.assertEqual(second.returncode, 0)
            self.assertIn("1 ok, 0 synced, 0 problem(s)",
                          second.stdout)
            check = run("--registry", str(registry))
            self.assertEqual(check.returncode, 0)
            self.assertIn("1 ok, 0 synced, 0 problem(s)",
                          check.stdout)

    def test_missing_marker_pair_is_a_finding_not_a_skip(self):
        with tempfile.TemporaryDirectory() as tmp:
            plain = TARGET_HEAD + "No markers here.\n"
            registry = build_tree(Path(tmp), plain)
            result = run("--registry", str(registry))
            self.assertEqual(result.returncode, 1)
            self.assertIn("missing-markers consumer:AGENTS.md",
                          result.stdout)
            self.assertNotIn("fragment-drift", result.stdout)
            applied = run("--registry", str(registry), "--apply")
            self.assertEqual(applied.returncode, 1)
            self.assertIn("missing-markers consumer:AGENTS.md",
                          applied.stdout)
            dest = Path(tmp) / "consumer" / "AGENTS.md"
            self.assertEqual(dest.read_text(encoding="utf-8"),
                             plain)

    def test_missing_closing_marker_is_a_finding(self):
        with tempfile.TemporaryDirectory() as tmp:
            half = TARGET_HEAD + BEGIN + "\nOrphan block.\n"
            registry = build_tree(Path(tmp), half)
            result = run("--registry", str(registry))
            self.assertEqual(result.returncode, 1)
            self.assertIn("missing-markers consumer:AGENTS.md",
                          result.stdout)

    def test_mixed_registry_keeps_whole_file_behavior(self):
        with tempfile.TemporaryDirectory() as tmp:
            registry = build_tree(Path(tmp), drifted_target(),
                                  include_whole=True)
            result = run("--registry", str(registry))
            self.assertEqual(result.returncode, 1)
            self.assertIn("fragment-drift consumer:AGENTS.md",
                          result.stdout)
            self.assertIn("drift consumer:WHOLE.md",
                          result.stdout)
            applied = run("--registry", str(registry), "--apply")
            self.assertEqual(applied.returncode, 0)
            whole = Path(tmp) / "consumer" / "WHOLE.md"
            self.assertEqual(whole.read_text(encoding="utf-8"),
                             "canonical whole\n")
            check = run("--registry", str(registry))
            self.assertEqual(check.returncode, 0)
            self.assertIn("2 ok", check.stdout)


if __name__ == "__main__":
    unittest.main()
