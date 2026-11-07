import tempfile
import unittest
from pathlib import Path

from backend.foundation.scanners.asset_manifest import scan


def write(root, relpath, text):
    path = Path(root) / relpath
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def scan_tree(files):
    with tempfile.TemporaryDirectory() as tmp:
        for relpath, text in files.items():
            write(tmp, relpath, text)
        return scan(Path(tmp))


class AssetManifestScannerTests(unittest.TestCase):
    def test_unregistered_local_asset_is_a_finding(self):
        findings = scan_tree(
            {
                "frontend/logo.png": "binary",
                "frontend/assets-manifest.json": '{"assets": []}',
            }
        )
        self.assertEqual(
            [f.rule for f in findings], ["asset-manifest/unregistered"]
        )

    def test_registered_local_asset_is_clean(self):
        findings = scan_tree(
            {
                "frontend/logo.png": "binary",
                "frontend/assets-manifest.json": (
                    '{"assets": [{"path": "frontend/logo.png"}]}'
                ),
            }
        )
        self.assertEqual(findings, [])

    def test_stale_entry_is_a_finding(self):
        findings = scan_tree(
            {
                "frontend/assets-manifest.json": (
                    '{"assets": [{"path": "frontend/gone.png"}]}'
                ),
            }
        )
        self.assertEqual([f.rule for f in findings], ["asset-manifest/stale-entry"])

    def test_unregistered_external_asset_is_a_finding(self):
        findings = scan_tree(
            {
                "frontend/index.html": '<img src="https://cdn.example.com/a.png">',
                "frontend/assets-manifest.json": '{"assets": []}',
            }
        )
        self.assertEqual(
            [f.rule for f in findings], ["asset-manifest/unregistered-external"]
        )

    def test_assets_without_manifest_is_a_finding(self):
        findings = scan_tree({"frontend/logo.png": "binary"})
        self.assertEqual([f.rule for f in findings], ["asset-manifest/missing"])

    def test_no_assets_no_manifest_is_clean(self):
        self.assertEqual(scan_tree({"frontend/index.html": "<html></html>"}), [])


if __name__ == "__main__":
    unittest.main()
