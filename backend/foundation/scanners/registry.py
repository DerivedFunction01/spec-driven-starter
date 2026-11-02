"""Scanner registry: the one ordered tuple of every policy scanner.

The registry lives here, not in the package ``__init__``, because
no-reexport allows ``__init__.py`` nothing but a docstring.
Consumers import ``ALL_SCANNERS`` from this leaf module.
"""

from __future__ import annotations

from backend.foundation.scanners.base import Scanner
from backend.foundation.scanners.clean_exit import SCANNER as CLEAN_EXIT_SCANNER
from backend.foundation.scanners.denylist import SCANNER as DENYLIST_SCANNER
from backend.foundation.scanners.layers import SCANNER as LAYERS_SCANNER
from backend.foundation.scanners.legacy_shims import (
    SCANNER as LEGACY_SHIMS_SCANNER,
)
from backend.foundation.scanners.length import SCANNER as LENGTH_SCANNER
from backend.foundation.scanners.literal import SCANNER as LITERAL_SCANNER
from backend.foundation.scanners.no_reexport import (
    SCANNER as NO_REEXPORT_SCANNER,
)
from backend.foundation.scanners.portability import (
    SCANNER as PORTABILITY_SCANNER,
)
from backend.foundation.scanners.prose_length import (
    SCANNER as PROSE_LENGTH_SCANNER,
)
from backend.foundation.scanners.settings_seam import (
    SCANNER as SETTINGS_SEAM_SCANNER,
)
from backend.foundation.scanners.tests_tracked_only import (
    SCANNER as TESTS_TRACKED_ONLY_SCANNER,
)
from backend.foundation.scanners.tracking import SCANNER as TRACKING_SCANNER

ALL_SCANNERS: tuple[Scanner, ...] = (
    LENGTH_SCANNER,
    PORTABILITY_SCANNER,
    DENYLIST_SCANNER,
    LAYERS_SCANNER,
    NO_REEXPORT_SCANNER,
    SETTINGS_SEAM_SCANNER,
    LITERAL_SCANNER,
    LEGACY_SHIMS_SCANNER,
    PROSE_LENGTH_SCANNER,
    CLEAN_EXIT_SCANNER,
    TRACKING_SCANNER,
    TESTS_TRACKED_ONLY_SCANNER,
)

__all__ = ["ALL_SCANNERS"]
