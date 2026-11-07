"""Scanner registry: the one ordered tuple of every policy scanner.

The registry lives here, not in the package ``__init__``, because
no-reexport allows ``__init__.py`` nothing but a docstring.
Consumers import ``ALL_SCANNERS`` from this leaf module.
"""

from __future__ import annotations

from backend.foundation.scanners.a11y_static import SCANNER as A11Y_STATIC_SCANNER
from backend.foundation.scanners.asset_manifest import (
    SCANNER as ASSET_MANIFEST_SCANNER,
)
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
from backend.foundation.scanners.perf_budget import SCANNER as PERF_BUDGET_SCANNER
from backend.foundation.scanners.port_boundary import (
    SCANNER as PORT_BOUNDARY_SCANNER,
)
from backend.foundation.scanners.portability import (
    SCANNER as PORTABILITY_SCANNER,
)
from backend.foundation.scanners.privacy_pin import SCANNER as PRIVACY_PIN_SCANNER
from backend.foundation.scanners.prose_length import (
    SCANNER as PROSE_LENGTH_SCANNER,
)
from backend.foundation.scanners.route_coverage import (
    SCANNER as ROUTE_COVERAGE_SCANNER,
)
from backend.foundation.scanners.security_baseline import (
    SCANNER as SECURITY_BASELINE_SCANNER,
)
from backend.foundation.scanners.settings_seam import (
    SCANNER as SETTINGS_SEAM_SCANNER,
)
from backend.foundation.scanners.tests_tracked_only import (
    SCANNER as TESTS_TRACKED_ONLY_SCANNER,
)
from backend.foundation.scanners.tracking import SCANNER as TRACKING_SCANNER
from backend.foundation.scanners.value_source import SCANNER as VALUE_SOURCE_SCANNER

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
    ROUTE_COVERAGE_SCANNER,
    PORT_BOUNDARY_SCANNER,
    PRIVACY_PIN_SCANNER,
    ASSET_MANIFEST_SCANNER,
    SECURITY_BASELINE_SCANNER,
    A11Y_STATIC_SCANNER,
    PERF_BUDGET_SCANNER,
    VALUE_SOURCE_SCANNER,
)

__all__ = ["ALL_SCANNERS"]
