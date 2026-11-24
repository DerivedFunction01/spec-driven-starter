"""Estimates scanner: plan steps and todos carry estimates.
Entries — step headings, steps-list items, todo checkboxes —
carry [est: <duration>] (<n>m/<n>h tokens, summed); over sixty
minutes, the bracket's justification must name one of the
closed set of long-duration classes.
"""

from __future__ import annotations

import re
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import SKIP_DIRS, rel, tracked_paths

DOC_SUFFIX = ".md"
TODO_NAMES = frozenset({"todo.md", "todos.md"})
ARCHIVE_DIR = "finished"
QUESTIONS_WORD = "question"
OVERRUN_MINUTES = 60
JUSTIFICATION_WORDS = 3

# The closed set of long-duration classes (supervision rules,
# estimates passage): an over-hour justification is valid only
# when it names one. Each entry pairs the class's canonical
# name with the phrases that name it; matching is on whole
# words after normalization, so hyphen, slash, and case
# variation in the entry's wording is tolerated.
LONG_DURATION_CLASSES: tuple[tuple[str, tuple[str, ...]], ...] = (
    (
        "irreducible serial dependency",
        ("serial dependency", "serial dependencies", "serial by construction"),
    ),
    ("cpu-bound at full worker count", ("cpu-bound", "cpu-saturated")),
    ("memory-bandwidth or i/o-bound", ("memory-bandwidth", "i/o-bound")),
    (
        "limited compute or capacity queueing",
        ("capacity queueing", "capacity queuing", "limited compute"),
    ),
    ("network-held", ("network-held", "network-bound")),
    (
        "coordination and fan-in",
        ("coordination", "fan-in", "tail latency"),
    ),
    (
        "hard language-model or algorithmic complexity floor",
        ("algorithmic complexity", "complexity floor", "hard nlp"),
    ),
    (
        "critic and verification runs",
        ("critic", "verification run", "verification runs"),
    ),
    ("browser work", ("browser work",)),
    (
        "real-time observation window",
        ("observation window", "observation windows", "real-time observation"),
    ),
)


def _normalize(text: str) -> str:
    """Lowercase words of the text, punctuation as separators.

    A slash is dropped first, so "i/o-bound" and "io-bound"
    normalize to the same words.
    """
    return " ".join(re.sub(r"[^a-z0-9]+", " ", text.lower().replace("/", "")).split())


_CLASS_PHRASES: tuple[str, ...] = tuple(
    _normalize(phrase)
    for _name, phrases in LONG_DURATION_CLASSES
    for phrase in phrases
)


def _names_long_duration_class(justification: str) -> bool:
    """True when the justification names a long-duration class."""
    padded = f" {_normalize(justification)} "
    return any(f" {phrase} " in padded for phrase in _CLASS_PHRASES)


HEADING_RE = re.compile(r"^(#{1,4})\s+(.*?)\s*$")
STEP_HEADING_RE = re.compile(r"^Step\s+\d+\b")
NUMBERED_ITEM_RE = re.compile(r"^\d{1,3}[.)]\s+\S")
BULLET_ITEM_RE = re.compile(r"^[-*]\s+\S")
CHECKBOX_ITEM_RE = re.compile(r"^[-*]\s+\[[ xX]\]\s+\S")
ESTIMATE_RE = re.compile(r"\[est:\s*([^\]]*)\]")
DURATION_TOKEN_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)\b")
WORD_RE = re.compile(r"[A-Za-z][A-Za-z'-]*")


def _is_archive(parts: tuple[str, ...]) -> bool:
    for index, part in enumerate(parts):
        if part == ".plans" and index + 1 < len(parts):
            if parts[index + 1] == ARCHIVE_DIR:
                return True
    return False


def _in_population(relpath: str) -> bool:
    parts = Path(relpath).parts
    if _is_archive(parts):
        return False
    if parts[-1].lower() in TODO_NAMES:
        return True
    return ".plans" in parts[:-1]


def _walk_fallback(root: Path) -> list[Path]:
    found: list[Path] = []
    for path in sorted(root.rglob(f"*{DOC_SUFFIX}")):
        if not path.is_file():
            continue
        parts = path.relative_to(root).parts
        dirs = parts[:-1]
        if any(part in SKIP_DIRS and part != ".plans" for part in dirs):
            continue
        if _in_population(path.relative_to(root).as_posix()):
            found.append(path)
    return found


def population(root: Path) -> list[Path]:
    """Tracked plan and todo files, finished plans excluded."""
    tracked = tracked_paths(root)
    if tracked is not None:
        candidates = [root / name for name in sorted(tracked)]
        return [
            path
            for path in candidates
            if path.suffix == DOC_SUFFIX
            and path.is_file()
            and _in_population(rel(root, path))
        ]
    return _walk_fallback(root)


def _find_span_close(line: str, start: int, run: int) -> int | None:
    """End index of the backtick run of exactly ``run`` closing a span."""
    index = start
    length = len(line)
    while index < length:
        if line[index] != "`":
            index += 1
            continue
        run_end = index
        while run_end < length and line[run_end] == "`":
            run_end += 1
        if run_end - index == run:
            return run_end
        index = run_end
    return None


def _mask_code_spans(line: str) -> str:
    """The line with inline code spans blanked to spaces."""
    chars = list(line)
    index = 0
    length = len(line)
    while index < length:
        if line[index] != "`":
            index += 1
            continue
        run_end = index
        while run_end < length and line[run_end] == "`":
            run_end += 1
        close = _find_span_close(line, run_end, run_end - index)
        if close is None:
            index = run_end
            continue
        for position in range(index, close):
            chars[position] = " "
        index = close
    return "".join(chars)


def _mask_doc_lines(text: str) -> list[str]:
    """Doc lines with fenced blocks and code spans blanked."""
    masked: list[str] = []
    fence_char = ""
    for line in text.splitlines():
        stripped = line.lstrip()
        if fence_char:
            masked.append("")
            if stripped.startswith(fence_char * 3):
                fence_char = ""
            continue
        if stripped.startswith("```") or stripped.startswith("~~~"):
            fence_char = stripped[0]
            masked.append("")
            continue
        masked.append(_mask_code_spans(line))
    return masked


class _Entry:
    """One step or todo entry: its first line and its text."""

    def __init__(self, lineno: int, anchor_level: int) -> None:
        self.lineno = lineno
        self.anchor_level = anchor_level
        self.lines: list[str] = []


def _entries(lines: list[str], todo_file: bool) -> list[_Entry]:
    """Step and todo entries in masked doc lines, in order."""
    entries: list[_Entry] = []
    current: _Entry | None = None
    steps_level: int | None = None
    questions_level: int | None = None

    def close() -> None:
        nonlocal current
        if current is not None:
            entries.append(current)
            current = None

    for lineno, line in enumerate(lines, start=1):
        heading = HEADING_RE.match(line)
        if heading:
            level = len(heading.group(1))
            title = heading.group(2)
            if steps_level is not None and level <= steps_level:
                steps_level = None
            if questions_level is not None and level <= questions_level:
                questions_level = None
            if current is not None and level <= current.anchor_level:
                close()
            if STEP_HEADING_RE.match(title):
                close()
                current = _Entry(lineno, level)
                current.lines.append(line)
                continue
            if title.rstrip(":").lower() == "steps":
                steps_level = level
            if QUESTIONS_WORD in title.lower():
                questions_level = level
            if current is not None:
                current.lines.append(line)
            continue
        starts = False
        if CHECKBOX_ITEM_RE.match(line):
            starts = questions_level is None
        elif steps_level is not None and (
            NUMBERED_ITEM_RE.match(line) or BULLET_ITEM_RE.match(line)
        ):
            starts = True
        elif todo_file and (NUMBERED_ITEM_RE.match(line) or BULLET_ITEM_RE.match(line)):
            starts = True
        if starts:
            close()
            anchor = steps_level if steps_level is not None else 4
            current = _Entry(lineno, anchor)
        if current is not None:
            current.lines.append(line)
    close()
    return entries


def _parse_estimate(entry_text: str) -> tuple[float, int, str] | None:
    """(minutes, justification words, justification), or None
    when no bracket carries a leading duration — that bracket
    is no estimate.
    """
    match = ESTIMATE_RE.search(entry_text)
    if match is None:
        return None
    body = match.group(1)
    minutes = 0.0
    consumed = 0
    for token in DURATION_TOKEN_RE.finditer(body):
        if body[consumed : token.start()].strip(" \t,+"):
            break
        value = float(token.group(1))
        minutes += value * 60 if token.group(2).startswith("h") else value
        consumed = token.end()
    if consumed == 0:
        return None
    remainder = body[consumed:].strip(" \t—–-:")
    return minutes, len(WORD_RE.findall(remainder)), remainder


def _scan_file(root: Path, path: Path, text: str) -> list[Finding]:
    relpath = rel(root, path)
    todo_file = path.name.lower() in TODO_NAMES
    entries = _entries(_mask_doc_lines(text), todo_file)
    findings: list[Finding] = []
    if not entries:
        findings.append(
            Finding(
                scanner="estimates",
                rule="estimates/missing-estimate",
                path=relpath,
                line=1,
                message="plan or todo file carries no step or todo entries",
            )
        )
        return findings
    for entry in entries:
        parsed = _parse_estimate("\n".join(entry.lines))
        if parsed is None:
            findings.append(
                Finding(
                    scanner="estimates",
                    rule="estimates/missing-estimate",
                    path=relpath,
                    line=entry.lineno,
                    message="step or todo entry carries no estimate (content withheld)",
                )
            )
            continue
        minutes, justification_words, justification = parsed
        if minutes <= OVERRUN_MINUTES:
            continue
        if justification_words < JUSTIFICATION_WORDS:
            findings.append(
                Finding(
                    scanner="estimates",
                    rule="estimates/unjustified-overrun",
                    path=relpath,
                    line=entry.lineno,
                    message=(
                        "estimate over one hour carries no justification "
                        "(content withheld)"
                    ),
                )
            )
        elif not _names_long_duration_class(justification):
            findings.append(
                Finding(
                    scanner="estimates",
                    rule="estimates/unclassed-overrun",
                    path=relpath,
                    line=entry.lineno,
                    message=(
                        "estimate over one hour names no long-duration "
                        "class (content withheld)"
                    ),
                )
            )
    return findings


def _read_text(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return None


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    for path in population(root):
        text = _read_text(path)
        if text is None:
            findings.append(
                Finding(
                    scanner="estimates",
                    rule="estimates/missing-estimate",
                    path=rel(root, path),
                    line=1,
                    message="plan or todo file is unreadable (content withheld)",
                )
            )
            continue
        findings.extend(_scan_file(root, path, text))
    return findings


SCANNER = Scanner(
    name="estimates",
    description=(
        "plan steps and todos carry estimates; over an hour, the "
        "justification names a long-duration class"
    ),
    run=scan,
)
