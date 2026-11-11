"""Restatement scanner: one home per rule, deltas elsewhere.

A sentence of ``MIN_WORDS`` or more in two tracked documents
is a finding; fenced blocks are not read, and deliberate
duplication is named in ``EXCEPTIONS`` with its reason.
"""

from __future__ import annotations

import re
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import rel, walk_files

MIN_WORDS = 10
EXCLUDED_TREES = ("flavors",)

EXCEPTIONS = {
    "a behavior change amends the spec in the same change that implements it": (
        "the constitution states the rule; the method derives it"
    ),
    "if nothing here fits look on the web for a maintained api or mcp server "
    "and set it up with the harnesss customconnector setup skill or build a "
    "custom connector": "shared routing preamble of the coding skills",
    "use museconnectorsearch to find other connectors and museskillsearch "
    "to find related skills": "shared routing preamble of the coding skills",
}

_FENCE_RE = re.compile(r"^```", re.MULTILINE)
_SENTENCE_RE = re.compile(r"(?<=[.!?])\s+")
_WORD_RE = re.compile(r"[^a-z0-9 ]")


def _markdown_files(root: Path) -> list[Path]:
    found: list[Path] = []
    for path in walk_files(root, (".md",)):
        parts = path.relative_to(root).parts
        if parts and parts[0] in EXCLUDED_TREES and "files" in parts:
            continue
        found.append(path)
    return found


def _sentences(text: str) -> list[str]:
    """Normalized sentences of a document, fenced blocks removed."""
    kept: list[str] = []
    fenced = False
    for line in text.splitlines():
        if _FENCE_RE.match(line):
            fenced = not fenced
            continue
        if not fenced:
            kept.append(line)
    flat = " ".join(kept)
    sentences: list[str] = []
    for raw in _SENTENCE_RE.split(flat):
        norm = _WORD_RE.sub("", raw.lower())
        norm = re.sub(r"\s+", " ", norm).strip()
        if len(norm.split()) >= MIN_WORDS:
            sentences.append(norm)
    return sentences


def scan(root: Path) -> list[Finding]:
    homes: dict[str, list[str]] = {}
    for path in _markdown_files(root):
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        for sentence in set(_sentences(text)):
            homes.setdefault(sentence, []).append(rel(root, path))
    findings: list[Finding] = []
    for sentence, files in sorted(homes.items()):
        if len(files) < 2 or sentence in EXCEPTIONS:
            continue
        files.sort()
        for extra in files[1:]:
            findings.append(
                Finding(
                    scanner="restatement",
                    rule="restatement/duplicate-sentence",
                    path=extra,
                    line=None,
                    message=(
                        f"a {len(sentence.split())}-word sentence is restated "
                        f"from {files[0]}; trim to its delta or a pointer"
                    ),
                )
            )
    return findings


SCANNER = Scanner(
    name="restatement",
    description="no rule sentence restated across tracked documents",
    run=scan,
)
