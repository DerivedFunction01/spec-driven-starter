#!/usr/bin/env bash
# Watchdog — the restore ladder for the sample server, in the
# sibling companion servers' shape. Why it exists: a server
# started by hand has no supervision, and hosts are replaceable —
# a deployment can replace the host wholesale (the system unit
# dir is wiped, every unsupervised process dies) and the server
# is simply gone, silently. The ladder:
#   1. Healthy probe of GET /health. Healthy but the unit file
#      is missing (the wiped-unit-dir case): reinstall quietly.
#   2. Down: (re)install the unit, start under systemd
#      (Restart=always then guards it), poll-verify health.
#   3. Fallback: ops/serve.sh start — the direct path when no
#      unit could be installed, a supervisor retry when one is —
#      then poll-verify again.
# Exit 0 and silence: healthy, or restored and verified.
# Exit 1: every rung failed — a failure note is appended to the
# state log and printed to stderr; surfacing it is the keeper's
# job. Invocation is by an external keeper poll (the contract:
# poll on an interval, act only on nonzero exit); this repo
# ships the ladder, never a host-specific poller binding.
# Values come from the settings seam via backend.apps.ops_values.
#
# Test seams (env): FIELDKIT_UNIT_DIR, FIELDKIT_SYSTEMCTL,
# FIELDKIT_POLL_SECS (total poll budget per rung, default 60).
set -uo pipefail
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

OPS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$OPS_DIR")"
PYTHON="$ROOT/var/venv/bin/python"
[[ -x "$PYTHON" ]] || PYTHON="$(command -v python3)"
eval "$(cd "$ROOT" && "$PYTHON" -m backend.apps.ops_values 2>/dev/null)"
if [[ -z "${UNIT:-}" || -z "${PORT:-}" ]]; then
  echo "watchdog: settings values unavailable (build the venv first: python3 init_venv.py)" >&2
  exit 1
fi
UNIT_DIR="${FIELDKIT_UNIT_DIR:-/etc/systemd/system}"
SYSTEMCTL="${FIELDKIT_SYSTEMCTL:-systemctl}"
UNIT_FILE="$UNIT_DIR/$UNIT.service"
STATE_DIR="$ROOT/var/state"
STATE_LOG="$STATE_DIR/$UNIT.log"
HEALTH_URL="http://$HOST:$PORT/health"
POLL_SECS="${FIELDKIT_POLL_SECS:-60}"

healthy() {
  curl -s --max-time 5 -o /dev/null "$HEALTH_URL"
}

wait_healthy() {
  local deadline=$((SECONDS + POLL_SECS))
  while (( SECONDS < deadline )); do
    if healthy; then
      return 0
    fi
    sleep 2
  done
  healthy
}

fail() {
  local note="watchdog: $1 ($(date -u +%Y-%m-%dT%H:%M:%SZ))"
  mkdir -p "$STATE_DIR"
  echo "$note" >> "$STATE_LOG"
  echo "$note" >&2
  exit 1
}

install_quiet() {
  bash "$OPS_DIR/install-unit.sh" >>"$STATE_LOG" 2>&1
}

mkdir -p "$STATE_DIR"

if healthy; then
  if [[ ! -f "$UNIT_FILE" ]]; then
    install_quiet || fail "server healthy but unit reinstall failed"
  fi
  exit 0
fi

# Rung 1: systemd supervision.
if install_quiet; then
  "$SYSTEMCTL" start "$UNIT.service" >>"$STATE_LOG" 2>&1 || true
  if wait_healthy; then
    exit 0
  fi
fi

# Rung 2: the serve.sh path (direct start, or a supervisor retry).
bash "$OPS_DIR/serve.sh" start >>"$STATE_LOG" 2>&1 || true
if wait_healthy; then
  exit 0
fi

fail "restore ladder failed; server still unhealthy at $HEALTH_URL"
