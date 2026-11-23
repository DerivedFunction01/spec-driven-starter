"""Scanner registry: the one ordered tuple of every policy scanner.

The registry lives here, not in the package ``__init__``, because
no-reexport allows ``__init__.py`` nothing but a docstring.
Consumers import ``ALL_SCANNERS`` from this leaf module.
"""

from __future__ import annotations

from backend.foundation.scanners.base import Scanner
from backend.foundation.scanners.content.denylist import SCANNER as DENYLIST_SCANNER
from backend.foundation.scanners.content.literal import SCANNER as LITERAL_SCANNER
from backend.foundation.scanners.content.living_dates import (
    SCANNER as LIVING_DATES_SCANNER,
)
from backend.foundation.scanners.content.portability import (
    SCANNER as PORTABILITY_SCANNER,
)
from backend.foundation.scanners.content.prose_length import (
    SCANNER as PROSE_LENGTH_SCANNER,
)
from backend.foundation.scanners.content.restatement import (
    SCANNER as RESTATEMENT_SCANNER,
)
from backend.foundation.scanners.content.tracking import SCANNER as TRACKING_SCANNER
from backend.foundation.scanners.content.value_source import (
    SCANNER as VALUE_SOURCE_SCANNER,
)
from backend.foundation.scanners.runtime.a11y_static import (
    SCANNER as A11Y_STATIC_SCANNER,
)
from backend.foundation.scanners.runtime.adapter_mirror import (
    SCANNER as ADAPTER_MIRROR_SCANNER,
)
from backend.foundation.scanners.runtime.asset_manifest import (
    SCANNER as ASSET_MANIFEST_SCANNER,
)
from backend.foundation.scanners.runtime.clean_exit import SCANNER as CLEAN_EXIT_SCANNER
from backend.foundation.scanners.runtime.perf_budget import (
    SCANNER as PERF_BUDGET_SCANNER,
)
from backend.foundation.scanners.runtime.port_boundary import (
    SCANNER as PORT_BOUNDARY_SCANNER,
)
from backend.foundation.scanners.runtime.privacy_pin import (
    SCANNER as PRIVACY_PIN_SCANNER,
)
from backend.foundation.scanners.runtime.route_coverage import (
    SCANNER as ROUTE_COVERAGE_SCANNER,
)
from backend.foundation.scanners.runtime.security_baseline import (
    SCANNER as SECURITY_BASELINE_SCANNER,
)
from backend.foundation.scanners.runtime.settings_seam import (
    SCANNER as SETTINGS_SEAM_SCANNER,
)
from backend.foundation.scanners.runtime.time_ownership import (
    SCANNER as TIME_OWNERSHIP_SCANNER,
)
from backend.foundation.scanners.runtime.writer_uniqueness import (
    SCANNER as WRITER_UNIQUENESS_SCANNER,
)
from backend.foundation.scanners.structure.folder_density import (
    SCANNER as FOLDER_DENSITY_SCANNER,
)
from backend.foundation.scanners.structure.layers import SCANNER as LAYERS_SCANNER
from backend.foundation.scanners.structure.legacy_shims import (
    SCANNER as LEGACY_SHIMS_SCANNER,
)
from backend.foundation.scanners.structure.length import SCANNER as LENGTH_SCANNER
from backend.foundation.scanners.structure.no_reexport import (
    SCANNER as NO_REEXPORT_SCANNER,
)
from backend.foundation.scanners.structure.path_discipline import (
    SCANNER as PATH_DISCIPLINE_SCANNER,
)
from backend.foundation.scanners.structure.tests_tracked_only import (
    SCANNER as TESTS_TRACKED_ONLY_SCANNER,
)

ALL_SCANNERS: tuple[Scanner, ...] = (
    LENGTH_SCANNER,
    PORTABILITY_SCANNER,
    DENYLIST_SCANNER,
    LAYERS_SCANNER,
    NO_REEXPORT_SCANNER,
    SETTINGS_SEAM_SCANNER,
    LITERAL_SCANNER,
    LIVING_DATES_SCANNER,
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
    RESTATEMENT_SCANNER,
    TIME_OWNERSHIP_SCANNER,
    PATH_DISCIPLINE_SCANNER,
    WRITER_UNIQUENESS_SCANNER,
    ADAPTER_MIRROR_SCANNER,
    FOLDER_DENSITY_SCANNER,
)

__all__ = ["ALL_SCANNERS"]
