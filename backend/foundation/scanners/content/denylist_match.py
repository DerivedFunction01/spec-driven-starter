"""Denylist matching: the one home for the semantics.

A line matches when it contains a provisioned literal in
any case variant (casefold, both sides): the same leak at
any case. List parsing (strip, skip blanks, ``#``) is here.
"""

from __future__ import annotations


def parse_literals(lines) -> list[str]:
    """Provisioned literals from denylist file lines."""
    return [
        line.strip()
        for line in lines
        if line.strip() and not line.strip().startswith("#")
    ]


def line_matches(line: str, literals: list[str]) -> bool:
    """True when the line contains any literal, in any
    case variant of either side."""
    folded = line.casefold()
    return any(literal.casefold() in folded for literal in literals)
