"""Accessibility static scanner: the gate's regression net.

The automatable floor: lang declared, images alted, controls
and buttons named, no positive tabindex. A clean run is never
an accessibility verdict — the manual pass is the other layer.
"""

from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path

from backend.foundation.scanners.base import Finding, Scanner
from backend.foundation.scanners.files import rel, walk_files

CONTROL_TAGS = ("input", "select", "textarea")
EXEMPT_INPUT_TYPES = ("hidden", "submit", "button")


class _Page(HTMLParser):
    """Collects the accessibility facts of one HTML file."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.lang_ok = False
        self.labels: set[str] = set()
        self.problems: list[tuple[str, int, str]] = []
        self._controls: list[tuple[str, int, dict[str, str]]] = []
        self._button: list | None = None

    def handle_starttag(self, tag: str, attrs: list) -> None:
        attr = dict(attrs)
        line = self.getpos()[0]
        if tag == "html":
            self.lang_ok = bool(attr.get("lang"))
        elif tag == "label" and attr.get("for"):
            self.labels.add(attr["for"])
        elif tag == "img" and "alt" not in attr:
            self.problems.append(("img-alt", line, "image has no alt attribute"))
        elif tag in CONTROL_TAGS:
            if not (tag == "input" and attr.get("type", "text") in EXEMPT_INPUT_TYPES):
                self._controls.append((tag, line, attr))
        elif tag == "button":
            self._button = [line, attr, ""]
        tabindex = attr.get("tabindex")
        if tabindex is not None:
            try:
                if int(tabindex) > 0:
                    self.problems.append(
                        (
                            "tabindex",
                            line,
                            "positive tabindex disturbs the focus order",
                        )
                    )
            except ValueError:
                pass

    def handle_data(self, data: str) -> None:
        if self._button is not None:
            self._button[2] += data

    def handle_endtag(self, tag: str) -> None:
        if tag == "button" and self._button is not None:
            line, attr, text = self._button
            if not text.strip() and not attr.get("aria-label"):
                self.problems.append(
                    ("button-name", line, "button has no accessible name")
                )
            self._button = None

    def finish(self) -> list[tuple[str, int, str]]:
        problems = list(self.problems)
        if not self.lang_ok:
            problems.append(("html-lang", 1, "html element declares no lang"))
        for tag, line, attr in self._controls:
            named = (
                attr.get("aria-label")
                or attr.get("aria-labelledby")
                or (attr.get("id") and attr["id"] in self.labels)
            )
            if not named:
                problems.append(
                    (
                        "control-name",
                        line,
                        f"{tag} control has no accessible name "
                        "(label, aria-label, or aria-labelledby)",
                    )
                )
        return problems


def scan(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    base = root / "frontend"
    if not base.is_dir():
        return findings
    for path in walk_files(base, (".html",)):
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        page = _Page()
        page.feed(text)
        for rule, line, message in page.finish():
            findings.append(
                Finding(
                    scanner="a11y_static",
                    rule=f"a11y-static/{rule}",
                    path=rel(root, path),
                    line=line,
                    message=message,
                )
            )
    return findings


SCANNER = Scanner(
    name="a11y_static",
    description="static accessibility floor over the frontend HTML",
    run=scan,
)
