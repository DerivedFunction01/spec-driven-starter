import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.base import SEVERITY_ERROR
from backend.foundation.scanners.structure.path_discipline import scan


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def scan_tree(files):
    with tempfile.TemporaryDirectory() as tmp:
        for relpath, text in files.items():
            write(tmp, relpath, text)
        return scan(Path(tmp))


class PathDisciplineScannerTests(unittest.TestCase):
    def test_parents_climb_is_a_finding(self):
        source = "from pathlib import Path\n\nROOT = Path(__file__).parents[2]\n"
        findings = scan_tree({"backend/services/model.py": source})
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].rule, "path-discipline/root-climb")

    def test_parent_chain_is_a_finding(self):
        source = "from pathlib import Path\n\nHERE = Path(__file__).parent.parent\n"
        findings = scan_tree({"backend/services/model.py": source})
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].rule, "path-discipline/root-climb")

    def test_single_parent_is_clean(self):
        source = "from pathlib import Path\n\nHERE = Path(__file__).parent\n"
        self.assertEqual(scan_tree({"backend/services/model.py": source}), [])

    def test_cwd_root_is_a_finding(self):
        findings = scan_tree({"backend/services/model.py": "import os\n\nR = os.getcwd()\n"})
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].rule, "path-discipline/cwd-root")

    def test_hardcoded_home_root_is_a_finding(self):
        source = 'ROOT = "/home/example/project"\n'
        findings = scan_tree({"backend/services/model.py": source})
        self.assertEqual(len(findings), 1)
        self.assertEqual(findings[0].rule, "path-discipline/hardcoded-root")

    def test_paths_module_is_the_spine_and_clean(self):
        source = "from pathlib import Path\n\nROOT = Path(__file__).parents[2]\n"
        self.assertEqual(scan_tree({"backend/foundation/paths.py": source}), [])

    def test_bootstrap_reference_is_clean(self):
        source = (
            "import importlib.util\n\n"
            "SPEC = importlib.util.spec_from_file_location('p', 'paths.py')\n"
            "ROOT = Path(__file__).parents[2]\n"
        )
        self.assertEqual(scan_tree({"backend/apps/boot.py": source}), [])

    def test_declared_settings_derivation_is_a_notice(self):
        source = "from pathlib import Path\n\nROOT = Path(__file__).resolve().parents[2]\n"
        findings = scan_tree({"backend/foundation/settings.py": source})
        self.assertTrue(findings)
        self.assertTrue(all(f.severity != SEVERITY_ERROR for f in findings))

    def test_stale_declaration_is_a_finding(self):
        findings = scan_tree({"backend/foundation/settings.py": "X = 1\n"})
        rules = {f.rule for f in findings}
        self.assertIn("path-discipline/stale-exception", rules)

    def test_test_tree_is_out_of_scope(self):
        source = "from pathlib import Path\n\nROOT = Path(__file__).parents[1]\n"
        self.assertEqual(scan_tree({"tests/test_model.py": source}), [])


if __name__ == "__main__":
    unittest.main()
