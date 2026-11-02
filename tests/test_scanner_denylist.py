import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from backend.foundation.scanners.base import SEVERITY_ERROR, SEVERITY_NOTICE
from backend.foundation.scanners.denylist import scan

LITERAL = "Zxqwv Testperson"
ENV_VAR = "STARTER_DENYLIST_FILE"


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def without_env():
    env = dict(os.environ)
    env.pop(ENV_VAR, None)
    return mock.patch.dict(os.environ, env, clear=True)


class DenylistScannerTests(unittest.TestCase):
    def test_unconfigured_yields_exactly_one_notice(self):
        with tempfile.TemporaryDirectory() as tmp, without_env():
            write(tmp, "note.md", "plain text\n")
            findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].severity, SEVERITY_NOTICE)
            self.assertEqual(findings[0].rule, "denylist/personal-unconfigured")

    def test_env_provisioned_literal_is_an_error(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "list.txt", LITERAL + "\n")
            write(tmp, "note.md", f"ask {LITERAL} about it\n")
            env = {ENV_VAR: str(Path(tmp) / "list.txt")}
            with mock.patch.dict(os.environ, env, clear=True):
                findings = scan(Path(tmp))
            errors = [f for f in findings if f.severity == SEVERITY_ERROR]
            self.assertEqual(len(errors), 1)
            self.assertEqual(errors[0].path, "note.md")
            for finding in findings:
                self.assertNotIn(LITERAL, str(finding))

    def test_denylist_file_itself_is_never_scanned(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "list.txt", LITERAL + "\n")
            env = {ENV_VAR: str(Path(tmp) / "list.txt")}
            with mock.patch.dict(os.environ, env, clear=True):
                self.assertEqual(scan(Path(tmp)), [])

    def test_unreadable_env_path_does_not_fall_back(self):
        with tempfile.TemporaryDirectory() as tmp:
            write(tmp, "var/config/denylist.txt", LITERAL + "\n")
            write(tmp, "note.md", f"ask {LITERAL} about it\n")
            env = {ENV_VAR: str(Path(tmp) / "missing.txt")}
            with mock.patch.dict(os.environ, env, clear=True):
                findings = scan(Path(tmp))
            self.assertEqual(len(findings), 1)
            self.assertEqual(findings[0].severity, SEVERITY_NOTICE)

    def test_default_path_provisioned(self):
        with tempfile.TemporaryDirectory() as tmp, without_env():
            write(tmp, "var/config/denylist.txt", LITERAL + "\n")
            write(tmp, "note.md", f"ask {LITERAL} about it\n")
            findings = scan(Path(tmp))
            errors = [f for f in findings if f.severity == SEVERITY_ERROR]
            self.assertEqual(len(errors), 1)


if __name__ == "__main__":
    unittest.main()
