import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "frontend" / "index.html").read_text(encoding="utf-8")
CSS = (ROOT / "frontend" / "app.css").read_text(encoding="utf-8")

HEX_RE = re.compile(r"#([0-9a-fA-F]{6})\b")
COLOR_RE = re.compile(r"(?<![\w-])color:\s*(#[0-9a-fA-F]{6})")
WIDTH_RE = re.compile(r"(?<![\w-])(?:min-)?width:\s*(\d+)px")


def luminance(hex_color):
    digits = hex_color.lstrip("#")
    channels = [int(digits[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    linear = [
        c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels
    ]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


def contrast(foreground, background):
    high, low = sorted(
        (luminance(foreground), luminance(background)), reverse=True
    )
    return (high + 0.05) / (low + 0.05)


class SurfaceNetTests(unittest.TestCase):
    """The catch-net over the sample surface (docs/checks.md)."""

    def test_furniture_is_present(self):
        for needle in ("<title>", "<header", "<main", 'role="status"'):
            self.assertIn(needle, HTML)

    def test_viewport_meta_is_present(self):
        self.assertIn('name="viewport"', HTML)

    def test_no_fixed_width_overflows_a_320px_viewport(self):
        for match in WIDTH_RE.finditer(CSS):
            self.assertLessEqual(int(match.group(1)), 320, match.group(0))

    def test_declared_text_colors_meet_the_contrast_floor(self):
        # Page background: the body's declared background, else white.
        body = re.search(r"body\s*{([^}]*)}", CSS)
        background = "#ffffff"
        if body:
            found = re.search(r"background(?:-color)?:\s*(#[0-9a-fA-F]{6})", body.group(1))
            if found:
                background = found.group(1)
        for match in COLOR_RE.finditer(CSS):
            self.assertGreaterEqual(
                contrast(match.group(1), background),
                4.5,
                f"{match.group(1)} on {background}",
            )


if __name__ == "__main__":
    unittest.main()
