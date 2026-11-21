import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.literal import scan


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def scan_text(text):
    with tempfile.TemporaryDirectory() as tmp:
        write(tmp, "mod.py", text)
        return scan(Path(tmp))


class LiteralScannerTests(unittest.TestCase):
    def test_ssn_shape_is_a_finding(self):
        findings = scan_text('SSN = "123-45-6789"\n')
        self.assertEqual([f.rule for f in findings], ["literal/ssn-shaped"])

    def test_credential_assignment_is_a_finding(self):
        findings = scan_text('api_key = "kX92mfQp47zs"\n')
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].rule, "literal/credential-shaped")
        self.assertNotIn("kX92mfQp47zs", findings[0].message)

    def test_placeholder_values_are_clean(self):
        self.assertEqual(scan_text('password = "example-password"\n'), [])
        self.assertEqual(scan_text('token = "fake"\n'), [])
        self.assertEqual(scan_text('secret = "abc"\n'), [])

    def test_github_token_shape_is_a_finding(self):
        token = "ghp_" + "A1" * 12
        findings = scan_text(f'note = "{token}"\n')
        self.assertEqual([f.rule for f in findings], ["literal/token-shaped"])

    def test_plain_code_is_clean(self):
        self.assertEqual(scan_text("count = 42\n"), [])


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
class LiteralTrackedPopulationTests(unittest.TestCase):
    def test_only_tracked_files_are_scanned(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            git(root, "init", "-q")
            write(root, "tracked.py", 'SSN = "123-45-6789"\n')
            git(root, "add", "tracked.py")
            git(root, "commit", "-q", "-m", "seed")
            write(root, "untracked.py", 'SSN = "123-45-6789"\n')
            findings = scan(root)
            self.assertEqual({f.path for f in findings}, {"tracked.py"})
            git(root, "add", "untracked.py")
            findings = scan(root)
            self.assertEqual({f.path for f in findings}, {"tracked.py", "untracked.py"})


if __name__ == "__main__":
    unittest.main()
