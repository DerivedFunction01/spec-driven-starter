import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.writer_uniqueness import scan


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def scan_tree(files):
    with tempfile.TemporaryDirectory() as tmp:
        for relpath, text in files.items():
            write(tmp, relpath, text)
        return scan(Path(tmp))


STAGED = (
    "import os\n"
    "\n"
    "\n"
    "def save(path, data):\n"
    "    tmp = path.with_suffix('.tmp')\n"
    "    tmp.write_text(data)\n"
    "    os.replace(tmp, path)\n"
)


class WriterUniquenessScannerTests(unittest.TestCase):
    def test_truncate_write_to_state_path_is_a_finding(self):
        source = "def save(data):\n    open('state/store.json', 'w').write(data)\n"
        findings = scan_tree({"backend/services/store.py": source})
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].rule, "writer-uniqueness/truncate-write")

    def test_write_text_to_state_constant_is_a_finding(self):
        source = "def save(data):\n    STATE_FILE.write_text(data)\n"
        findings = scan_tree({"backend/services/store.py": source})
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].rule, "writer-uniqueness/truncate-write")

    def test_write_to_plain_path_is_clean(self):
        source = (
            "from pathlib import Path\n"
            "\n"
            "\n"
            "def save(data):\n"
            "    Path('out.txt').write_text(data)\n"
        )
        self.assertEqual(scan_tree({"backend/services/report.py": source}), [])

    def test_partial_staged_write_is_a_finding(self):
        findings = scan_tree({"backend/services/store.py": STAGED})
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].rule, "writer-uniqueness/partial-staged-write")

    def test_full_staged_write_is_a_finding(self):
        source = STAGED.replace(
            "    os.replace(tmp, path)\n",
            "    os.fsync(1)\n    os.replace(tmp, path)\n",
        )
        findings = scan_tree({"backend/services/store.py": source})
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].rule, "writer-uniqueness/duplicate-staged-write")

    def test_declared_store_seam_is_clean(self):
        self.assertEqual(scan_tree({"backend/infra/store.py": STAGED}), [])

    def test_stale_declaration_is_a_finding(self):
        findings = scan_tree({"backend/infra/store.py": "X = 1\n"})
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].rule, "writer-uniqueness/stale-exception")

    def test_writer_home_is_never_scanned(self):
        findings = scan_tree({"backend/foundation/writer.py": STAGED})
        self.assertEqual(findings, [])


if __name__ == "__main__":
    unittest.main()
