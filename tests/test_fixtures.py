import json
import unittest
from pathlib import Path

from backend.foundation.settings import Settings
from backend.infra.sample_data import SAMPLE_KITS
from backend.infra.store import MemoryStore
from backend.services.model import build_model

FIXTURE = Path(__file__).parent / "fixtures" / "model-payload.json"


def shape(value):
    """The structural shape of a payload: keys, nesting, scalar types."""
    if isinstance(value, dict):
        return {key: shape(item) for key, item in value.items()}
    if isinstance(value, list):
        return [shape(value[0])] if value else []
    return type(value).__name__


class ProductionShapedFixtureTests(unittest.TestCase):
    def test_builder_output_matches_the_captured_shape(self):
        captured = json.loads(FIXTURE.read_text(encoding="utf-8"))
        live = build_model(MemoryStore(SAMPLE_KITS), Settings())
        self.assertEqual(shape(live), shape(captured))

    def test_fixture_keeps_production_structure(self):
        captured = json.loads(FIXTURE.read_text(encoding="utf-8"))
        kit = captured["kits"][0]
        self.assertIn("status_label", kit)
        self.assertIn("missing", kit)
        self.assertEqual(
            set(captured), {"contract", "generated_note", "kits", "totals"}
        )


if __name__ == "__main__":
    unittest.main()
