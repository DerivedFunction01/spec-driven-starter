"""Settings values: the defaults a fresh clone runs on, and
the environment overrides that replace them."""

import os
import unittest
from unittest import mock

from backend.foundation.settings import Settings


class SettingsDefaultsTests(unittest.TestCase):
    def test_defaults(self):
        settings = Settings()
        self.assertEqual(settings.host, "127.0.0.1")
        self.assertEqual(settings.port, 8797)
        self.assertEqual(settings.unit_name, "field-kit")
        self.assertIsNone(settings.data_path)
        self.assertEqual(settings.low_spare_threshold, 1)


class SettingsEnvTests(unittest.TestCase):
    def test_from_env_overrides(self):
        env = {
            "FIELDKIT_HOST": "0.0.0.0",
            "FIELDKIT_PORT": "9001",
            "FIELDKIT_UNIT": "kit-service",
            "FIELDKIT_LOW_SPARE": "3",
        }
        with mock.patch.dict(os.environ, env, clear=True):
            settings = Settings.from_env()
        self.assertEqual(settings.host, "0.0.0.0")
        self.assertEqual(settings.port, 9001)
        self.assertEqual(settings.unit_name, "kit-service")
        self.assertEqual(settings.low_spare_threshold, 3)

    def test_from_env_defaults_without_env(self):
        with mock.patch.dict(os.environ, {}, clear=True):
            settings = Settings.from_env()
        self.assertEqual(settings, Settings())


if __name__ == "__main__":
    unittest.main()
