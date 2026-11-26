import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from backend.foundation.scanners.content.portability import scan


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def rules(findings):
    return sorted({finding.rule for finding in findings})


class PortabilityScannerTests(unittest.TestCase):
    def scan_text(self, text, relpath="note.md"):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, relpath, text)
            return scan(Path(tmp))

    def test_clean_text_passes(self):
        findings = self.scan_text("kits live in backend/domain\n")
        self.assertEqual(findings, [])

    def test_absolute_home_path_is_a_finding(self):
        findings = self.scan_text("see " + "/h" + "ome/someone/x.py\n")
        self.assertEqual(rules(findings), ["portability/abs-path"])

    def test_tilde_path_is_a_finding(self):
        findings = self.scan_text("config at ~/private.yaml\n")
        self.assertEqual(rules(findings), ["portability/home-path"])

    def test_specific_plan_file_is_a_finding(self):
        findings = self.scan_text("see .plans/2026-01-01-example.md\n")
        self.assertEqual(rules(findings), ["portability/untracked-ref"])

    def test_bare_plans_directory_mention_is_clean(self):
        findings = self.scan_text("plans live under .plans/ here\n")
        self.assertEqual(findings, [])

    def test_dated_memory_log_is_a_finding(self):
        findings = self.scan_text("logged in memory/2026-01-01\n")
        self.assertEqual(rules(findings), ["portability/untracked-ref"])

    def test_windows_drive_path_is_a_finding(self):
        findings = self.scan_text("path " + "C:" + "\\" + "work\n")
        self.assertEqual(rules(findings), ["portability/abs-path"])

    def test_findings_never_print_matched_content(self):
        needle = "/h" + "ome/someone/x.py"
        findings = self.scan_text(f"see {needle}\n")
        self.assertTrue(findings)
        for finding in findings:
            self.assertNotIn(needle, finding.message)


def git(root, *args):
    subprocess.run(
        [
            "git",
            "-C",
            str(root),
            "-c",
            "user.email=test@example.com",
            "-c",
            "user.name=Test",
            *args,
        ],
        check=True,
        capture_output=True,
        text=True,
    )


@unittest.skipUnless(shutil.which("git"), "git not on PATH")
class PortabilityTrackedPopulationTests(unittest.TestCase):
    def test_only_tracked_files_are_scanned(self):
        violation = "see " + "/h" + "ome/someone/x.py\n"
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            git(root, "init", "-q")
            write(root, "tracked.md", violation)
            git(root, "add", "tracked.md")
            git(root, "commit", "-q", "-m", "seed")
            write(root, "untracked.md", violation)
            findings = scan(root)
            self.assertEqual({f.path for f in findings}, {"tracked.md"})
            git(root, "add", "untracked.md")
            findings = scan(root)
            self.assertEqual({f.path for f in findings}, {"tracked.md", "untracked.md"})


class PortabilityRepoSetTests(unittest.TestCase):
    def provision(self, root, names=("other-repo",)):
        write(root, "var/config/repo-set.txt", "\n".join(names) + "\n")

    def test_code_naming_another_repo_is_a_finding(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.provision(tmp)
            write(tmp, "tool.py", "TARGET = 'other-repo'\n")
            findings = scan(Path(tmp))
            self.assertEqual(rules(findings), ["portability/external-repo-ref"])
            self.assertEqual(findings[0].path, "tool.py")
            self.assertIn("other-repo", findings[0].message)

    def test_repo_path_reference_in_code_is_a_finding(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.provision(tmp)
            write(tmp, "ops/run.sh", "cd ../other-repo && make\n")
            findings = scan(Path(tmp))
            self.assertEqual(rules(findings), ["portability/external-repo-ref"])

    def test_docs_naming_another_repo_are_clean(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.provision(tmp)
            write(tmp, "notes.md", "the other-repo gate runs nightly\n")
            self.assertEqual(scan(Path(tmp)), [])

    def test_data_naming_another_repo_is_clean(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.provision(tmp)
            write(tmp, "config.json", '{"peer": "other-repo"}\n')
            self.assertEqual(scan(Path(tmp)), [])

    def test_own_repo_name_is_clean(self):
        with tempfile.TemporaryDirectory() as tmp:
            own = Path(tmp).name
            self.provision(tmp, names=(own, "other-repo"))
            write(tmp, "tool.py", f"HOME_REPO = '{own}'\n")
            self.assertEqual(scan(Path(tmp)), [])

    def test_joined_token_is_not_a_reference(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.provision(tmp)
            write(tmp, "tool.py", "TARGET = 'other-repo-tools'\n")
            self.assertEqual(scan(Path(tmp)), [])

    def test_unprovisioned_set_is_silent(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "tool.py", "TARGET = 'other-repo'\n")
            self.assertEqual(scan(Path(tmp)), [])

    def test_env_named_set_file_provisions(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "set.txt", "other-repo\n")
            write(tmp, "tool.py", "TARGET = 'other-repo'\n")
            with mock.patch.dict(
                os.environ, {"STARTER_REPO_SET_FILE": str(Path(tmp) / "set.txt")}
            ):
                findings = scan(Path(tmp))
            self.assertEqual(rules(findings), ["portability/external-repo-ref"])


if __name__ == "__main__":
    unittest.main()
