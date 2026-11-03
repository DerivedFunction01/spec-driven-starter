#!/usr/bin/env bash
# Render the server's systemd unit from ops/server.service.tmpl
# and install it into the unit dir. Every substituted value comes
# from the settings seam (backend.apps.ops_values, run under the
# repo venv python when built, else python3): @ROOT@ the repo
# root derived from this script's location, @PYTHON@ that
# interpreter, @HOME@ the installing user's home, @HOST@/@PORT@
# and @UNIT@ from Settings. Idempotent: re-rendering over an
# installed unit with unchanged content is a no-op.
#
# Test seams (env): FIELDKIT_UNIT_DIR, FIELDKIT_SYSTEMCTL.
set -euo pipefail
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

OPS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$OPS_DIR")"
PYTHON="$ROOT/var/venv/bin/python"
[[ -x "$PYTHON" ]] || PYTHON="$(command -v python3)"
eval "$(cd "$ROOT" && "$PYTHON" -m backend.apps.ops_values)"
if [[ -z "${UNIT:-}" || -z "${PORT:-}" ]]; then
  echo "install-unit: settings values unavailable (build the venv first: python3 init_venv.py)" >&2
  exit 1
fi
UNIT_DIR="${FIELDKIT_UNIT_DIR:-/etc/systemd/system}"
SYSTEMCTL="${FIELDKIT_SYSTEMCTL:-systemctl}"
UNIT_FILE="$UNIT_DIR/$UNIT.service"

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
sed -e "s|@ROOT@|$ROOT|g" -e "s|@PYTHON@|$PYTHON|g" \
    -e "s|@HOME@|$HOME|g" -e "s|@HOST@|$HOST|g" \
    -e "s|@PORT@|$PORT|g" -e "s|@UNIT@|$UNIT|g" \
    "$OPS_DIR/server.service.tmpl" > "$tmp"

mkdir -p "$UNIT_DIR" "$ROOT/var/state"
if [[ -f "$UNIT_FILE" ]] && cmp -s "$tmp" "$UNIT_FILE"; then
  echo "install-unit: $UNIT.service already installed (unchanged)"
  exit 0
fi
cp "$tmp" "$UNIT_FILE"
chmod 644 "$UNIT_FILE"
"$SYSTEMCTL" daemon-reload
"$SYSTEMCTL" enable "$UNIT.service" >/dev/null 2>&1 || true
echo "install-unit: installed $UNIT.service for ROOT=$ROOT PYTHON=$PYTHON"
