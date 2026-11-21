import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.base import SEVERITY_ERROR, SEVERITY_NOTICE
from backend.foundation.scanners.structure.folder_density import (
    CREEP_FILES,
    MAX_FILES,
    scan,
)


def populate(root, folder, count, suffix=".py"):
    base = Path(root) / folder if folder else Path(root)
    base.mkdir(parents=True, exist_ok=True)
    for index in range(count):
        (base / f"file{index:02d}{suffix}").write_text("x = 1\n", encoding="utf-8")


def git(root, *args):
    subprocess.run(
        ["git", "-c", "user.email=test@example.com", "-c", "user.name=Test", *args],
        cwd=root,
        capture_output=True,
        text=True,
        check=True,
    )


class FolderDensityScannerTests(unittest.TestCase):
    def test_folder_at_cap_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            populate(tmp, "pkg", MAX_FILES)
            findings = scan(Path(tmp))
            errors = [f for f in findings if f.severity == SEVERITY_ERROR]
            self.assertEqual(errors, [])
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "folder_density/creep-band")
            self.assertEqual(findings[0].severity, SEVERITY_NOTICE)

    def test_folder_over_cap_is_an_error(self):
        with tempfile.TemporaryDirectory() as tmp:
            populate(tmp, "pkg", MAX_FILES + 1)
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "folder_density/folder-density")
            self.assertEqual(findings[0].severity, SEVERITY_ERROR)
            self.assertEqual(findings[0].path, "pkg")

    def test_root_folder_over_cap_reports_dot(self):
        with tempfile.TemporaryDirectory() as tmp:
            populate(tmp, "", MAX_FILES + 1)
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].path, ".")

    def test_band_folder_is_notice_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            populate(tmp, "pkg", CREEP_FILES + 1)
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "folder_density/creep-band")
            self.assertEqual(findings[0].severity, SEVERITY_NOTICE)

    def test_folder_at_creep_floor_is_clean(self):
        with tempfile.TemporaryDirectory() as tmp:
            populate(tmp, "pkg", CREEP_FILES)
            self.assertEqual(scan(Path(tmp)), [])

    def test_subfolder_files_never_count_toward_parent(self):
        with tempfile.TemporaryDirectory() as tmp:
            populate(tmp, "pkg", MAX_FILES)
            populate(tmp, "pkg/sub", MAX_FILES)
            findings = scan(Path(tmp))
            errors = [f for f in findings if f.severity == SEVERITY_ERROR]
            self.assertEqual(errors, [])
            self.assertEqual({f.path for f in findings}, {"pkg", "pkg/sub"})

    def test_data_files_count(self):
        with tempfile.TemporaryDirectory() as tmp:
            populate(tmp, "data", MAX_FILES + 1, suffix=".json")
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "folder_density/folder-density")
            self.assertEqual(findings[0].path, "data")

    def test_markdown_files_count(self):
        with tempfile.TemporaryDirectory() as tmp:
            populate(tmp, "docs", MAX_FILES + 1, suffix=".md")
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "folder_density/folder-density")
            self.assertEqual(findings[0].path, "docs")

    def test_mixed_kinds_count_together(self):
        with tempfile.TemporaryDirectory() as tmp:
            populate(tmp, "mix", 8, suffix=".py")
            populate(tmp, "mix", 8, suffix=".md")
            (Path(tmp) / "mix" / "font.woff2").write_bytes(b"x")
            (Path(tmp) / "mix" / "data.json").write_text("{}\n", encoding="utf-8")
            (Path(tmp) / "mix" / "notes.txt").write_text("x\n", encoding="utf-8")
            (Path(tmp) / "mix" / "sheet.csv").write_text("x\n", encoding="utf-8")
            (Path(tmp) / "mix" / "blob.bin").write_bytes(b"x")
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "folder_density/folder-density")
            self.assertEqual(findings[0].path, "mix")

    def test_flavor_payload_folder_counts(self):
        with tempfile.TemporaryDirectory() as tmp:
            populate(tmp, "flavors/webapp/files/pkg", MAX_FILES + 1)
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "folder_density/folder-density")
            self.assertEqual(findings[0].path, "flavors/webapp/files/pkg")

    def test_assets_folder_counts(self):
        with tempfile.TemporaryDirectory() as tmp:
            populate(tmp, "pkg/assets", MAX_FILES + 1, suffix=".css")
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "folder_density/folder-density")
            self.assertEqual(findings[0].path, "pkg/assets")


@unittest.skipUnless(shutil.which("git"), "git not on PATH")
class FolderDensityGitTests(unittest.TestCase):
    def make_repo(self, tmp, band_count):
        git(tmp, "init", "-q")
        populate(tmp, "pkg", band_count)
        git(tmp, "add", "-A")
        git(tmp, "commit", "-q", "-m", "init")

    def test_band_addition_over_head_is_an_error(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.make_repo(tmp, CREEP_FILES + 1)
            populate(tmp, "pkg", 0)
            (Path(tmp) / "pkg" / "added.py").write_text("x = 1\n", encoding="utf-8")
            git(tmp, "add", "-A")
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "folder_density/band-addition")
            self.assertEqual(findings[0].severity, SEVERITY_ERROR)
            self.assertEqual(findings[0].path, "pkg")

    def test_band_folder_unchanged_from_head_is_notice_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.make_repo(tmp, CREEP_FILES + 2)
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "folder_density/creep-band")
            self.assertEqual(findings[0].severity, SEVERITY_NOTICE)

    def test_band_folder_shrunk_from_head_is_notice_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.make_repo(tmp, CREEP_FILES + 3)
            (Path(tmp) / "pkg" / "file00.py").unlink()
            git(tmp, "add", "-A")
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "folder_density/creep-band")
            self.assertEqual(findings[0].severity, SEVERITY_NOTICE)

    def test_band_folder_absent_at_head_is_notice_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            git(tmp, "init", "-q")
            populate(tmp, "other", 2)
            git(tmp, "add", "-A")
            git(tmp, "commit", "-q", "-m", "init")
            populate(tmp, "pkg", CREEP_FILES + 1)
            git(tmp, "add", "-A")
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "folder_density/creep-band")
            self.assertEqual(findings[0].severity, SEVERITY_NOTICE)


if __name__ == "__main__":
    unittest.main()
