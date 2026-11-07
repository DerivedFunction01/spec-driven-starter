"""Asset-manifest scanner: every asset is manifest-referenced.

Local assets under ``frontend/`` and external asset URLs must
be registered in ``frontend/assets-manifest.json``; a
registered local asset must exist. Unregistered is an error.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import rel, walk_files

MANIFEST = "frontend/assets-manifest.json"
ASSET_SUFFIXES = (".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico")
FONT_SUFFIXES = (".woff", ".woff2")
REFERENCE_SUFFIXES = (".html", ".css", ".js", ".mjs")
URL_RE = re.compile(r"""https?://[^\s"')\]]+""")


def _manifest_entries(root: Path) -> tuple[set[str], set[str]] | None:
    """(local paths, external urls) from the manifest; None if unreadable."""
    manifest = root / MANIFEST
    if not manifest.is_file():
        return None
    try:
        data = json.loads(manifest.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        return None
    local: set[str] = set()
    external: set[str] = set()
    for entry in data.get("assets", []):
        if isinstance(entry, dict) and "path" in entry:
            local.add(entry["path"])
        elif isinstance(entry, dict) and "url" in entry:
            external.add(entry["url"])
    return local, external


def _external_assets(root: Path) -> set[str]:
    """External asset URLs referenced by the frontend files."""
    found: set[str] = set()
    base = root / "frontend"
    if not base.is_dir():
        return found
    for path in walk_files(base, REFERENCE_SUFFIXES):
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        for url in URL_RE.findall(text):
            if url.lower().split("?")[0].endswith(ASSET_SUFFIXES + FONT_SUFFIXES):
                found.add(url)
    return found


def scan(root: Path) -> list[Finding]:
    base = root / "frontend"
    if not base.is_dir():
        return []
    entries = _manifest_entries(root)
    local_assets = {
        rel(root, path) for path in walk_files(base, ASSET_SUFFIXES + FONT_SUFFIXES)
    }
    external_assets = _external_assets(root)
    if entries is None:
        if not local_assets and not external_assets:
            return []
        return [
            Finding(
                scanner="asset_manifest",
                rule="asset-manifest/missing",
                path=MANIFEST,
                line=None,
                message=(
                    "assets are referenced but no asset manifest exists; "
                    "every asset is manifest-referenced"
                ),
            )
        ]
    local, external = entries
    findings: list[Finding] = []
    for asset in sorted(local_assets - local):
        findings.append(
            Finding(
                scanner="asset_manifest",
                rule="asset-manifest/unregistered",
                path=asset,
                line=None,
                message=f"asset is not registered in {MANIFEST}",
            )
        )
    for asset in sorted(local - local_assets):
        findings.append(
            Finding(
                scanner="asset_manifest",
                rule="asset-manifest/stale-entry",
                path=MANIFEST,
                line=None,
                message=f"manifest registers {asset}, which does not exist",
            )
        )
    for url in sorted(external_assets - external):
        findings.append(
            Finding(
                scanner="asset_manifest",
                rule="asset-manifest/unregistered-external",
                path=MANIFEST,
                line=None,
                message=(
                    f"external asset {url} is referenced but not registered "
                    "with its preflight record"
                ),
            )
        )
    return findings


SCANNER = Scanner(
    name="asset_manifest",
    description="every asset is registered in frontend/assets-manifest.json",
    run=scan,
)
