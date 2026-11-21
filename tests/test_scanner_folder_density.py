import tempfile
import unittest
from pathlib import Path
from unittest import mock

import backend.foundation.scanners.folder_density as folder_density
from backend.foundation.scanners.base import SEVERITY_ERROR, SEVERITY_NOTICE
from backend.foundation.scanners.folder_density import (
    CREEP_FILES,
    MAX_FILES,
    scan,
)


def populate(root, folder, count, suffix=".py"):
    base = Path(root) / folder if folder else Path(root)
    base.mkdir(parents=True, exist_ok=True)
    for index in range(count):
        (base / f"file{index:02d}{suffix}").write_text("x = 1\n", encoding="utf-8")


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

    def test_registered_folder_grown_past_record_is_an_error(self):
        with tempfile.TemporaryDirectory() as tmp:
            populate(tmp, "pkg", CREEP_FILES + 3)
            register = (("pkg", CREEP_FILES + 2),)
            with mock.patch.object(folder_density, "REGISTER", register):
                findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "folder_density/register-growth")
            self.assertEqual(findings[0].severity, SEVERITY_ERROR)

    def test_registered_folder_shrunk_in_band_is_stale(self):
        with tempfile.TemporaryDirectory() as tmp:
            populate(tmp, "pkg", CREEP_FILES + 2)
            register = (("pkg", CREEP_FILES + 4),)
            with mock.patch.object(folder_density, "REGISTER", register):
                findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "folder_density/register-stale")
            self.assertEqual(findings[0].severity, SEVERITY_ERROR)

    def test_registered_folder_at_creep_floor_is_stale(self):
        with tempfile.TemporaryDirectory() as tmp:
            populate(tmp, "pkg", CREEP_FILES)
            register = (("pkg", CREEP_FILES + 2),)
            with mock.patch.object(folder_density, "REGISTER", register):
                findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "folder_density/register-stale")

    def test_register_entry_for_missing_folder_is_stale(self):
        with tempfile.TemporaryDirectory() as tmp:
            populate(tmp, "pkg", 3)
            register = (("gone", MAX_FILES + 5),)
            with mock.patch.object(folder_density, "REGISTER", register):
                findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "folder_density/register-stale")
            self.assertEqual(findings[0].path, "gone")

    def test_registered_over_cap_at_record_passes_with_notice(self):
        with tempfile.TemporaryDirectory() as tmp:
            populate(tmp, "pkg", MAX_FILES + 5)
            register = (("pkg", MAX_FILES + 5),)
            with mock.patch.object(folder_density, "REGISTER", register):
                findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "folder_density/registered-over-cap")
            self.assertEqual(findings[0].severity, SEVERITY_NOTICE)

    def test_registered_band_folder_at_record_is_notice(self):
        with tempfile.TemporaryDirectory() as tmp:
            populate(tmp, "pkg", CREEP_FILES + 2)
            register = (("pkg", CREEP_FILES + 2),)
            with mock.patch.object(folder_density, "REGISTER", register):
                findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].rule, "folder_density/creep-band")
            self.assertEqual(findings[0].severity, SEVERITY_NOTICE)

    def test_subfolder_files_never_count_toward_parent(self):
        with tempfile.TemporaryDirectory() as tmp:
            populate(tmp, "pkg", MAX_FILES)
            populate(tmp, "pkg/sub", MAX_FILES)
            findings = scan(Path(tmp))
            errors = [f for f in findings if f.severity == SEVERITY_ERROR]
            self.assertEqual(errors, [])
            self.assertEqual({f.path for f in findings}, {"pkg", "pkg/sub"})

    def test_data_files_never_count(self):
        with tempfile.TemporaryDirectory() as tmp:
            populate(tmp, "data", MAX_FILES + 10, suffix=".json")
            populate(tmp, "data", MAX_FILES + 10, suffix=".md")
            self.assertEqual(scan(Path(tmp)), [])

    def test_flavor_payload_folder_never_counts(self):
        with tempfile.TemporaryDirectory() as tmp:
            populate(tmp, "flavors/webapp/files/pkg", MAX_FILES + 5)
            self.assertEqual(scan(Path(tmp)), [])

    def test_assets_folder_stylesheets_never_count(self):
        with tempfile.TemporaryDirectory() as tmp:
            populate(tmp, "pkg/assets", MAX_FILES + 5, suffix=".css")
            self.assertEqual(scan(Path(tmp)), [])

    def test_generated_folder_files_never_count(self):
        with tempfile.TemporaryDirectory() as tmp:
            populate(tmp, "pkg/generated", MAX_FILES + 5)
            self.assertEqual(scan(Path(tmp)), [])


if __name__ == "__main__":
    unittest.main()
