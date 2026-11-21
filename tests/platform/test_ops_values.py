"""Ops values: the module the ops/ scripts eval — app values
from the settings seam, process values from the interpreter."""

import io
import os
import unittest
from contextlib import redirect_stdout
from unittest import mock

from backend.apps import ops_values


class OpsValuesTests(unittest.TestCase):
    def _run(self, env):
        buffer = io.StringIO()
        with mock.patch.dict(os.environ, env, clear=True):
            with redirect_stdout(buffer):
                code = ops_values.main()
        self.assertEqual(code, 0)
        pairs = {}
        for line in buffer.getvalue().splitlines():
            key, _, value = line.partition("=")
            pairs[key] = value
        return pairs

    def test_keys_present(self):
        pairs = self._run({})
        for key in ("ROOT", "PYTHON", "HOME", "HOST", "PORT", "UNIT"):
            self.assertIn(key, pairs)
            self.assertTrue(pairs[key])

    def test_settings_values_flow_through(self):
        env = {"FIELDKIT_PORT": "9002", "FIELDKIT_UNIT": "kit-ops"}
        pairs = self._run(env)
        self.assertEqual(pairs["PORT"], "9002")
        self.assertEqual(pairs["UNIT"], "kit-ops")


if __name__ == "__main__":
    unittest.main()
