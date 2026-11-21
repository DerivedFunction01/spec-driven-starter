import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.files import (
    rel,
    tracked_paths,
    walk_files,
    walk_tracked,
)


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


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


class FilesHelperTests(unittest.TestCase):
    def test_non_git_tree_degrades_to_plain_walk(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            write(root, "a.py", "x = 1\n")
            self.assertIsNone(tracked_paths(root))
            self.assertEqual(walk_tracked(root, (".py",)), walk_files(root, (".py",)))

    @unittest.skipUnless(shutil.which("git"), "git not on PATH")
    def test_tracked_form_filters_to_ls_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            git(root, "init", "-q")
            write(root, "tracked.py", "x = 1\n")
            git(root, "add", "tracked.py")
            git(root, "commit", "-q", "-m", "seed")
            write(root, "untracked.py", "x = 2\n")
            self.assertEqual(tracked_paths(root), {"tracked.py"})
            walked = walk_tracked(root, (".py",))
            self.assertEqual([rel(root, p) for p in walked], ["tracked.py"])
            git(root, "add", "untracked.py")
            walked = walk_tracked(root, (".py",))
            self.assertEqual(
                [rel(root, p) for p in walked], ["tracked.py", "untracked.py"]
            )


if __name__ == "__main__":
    unittest.main()
