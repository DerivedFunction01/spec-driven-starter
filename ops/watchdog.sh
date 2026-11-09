#!/usr/bin/env bash
# Watchdog — the restore ladder for the sample server. Why it
# exists: a server started by hand has no supervision, and hosts
# are replaceable — a deployment can replace the host wholesale
# (the system unit dir is wiped, every unsupervised process
# dies) and the server is simply gone, silently.
# The recovery verdict is supervision itself: an answering port
# alone never counts as recovered — the responder must be the
# supervised unit's own process. The probe is bounded twice
# (a per-request cap inside a hard wall-clock budget), so a
# wedged service — headers sent, body stalled — can never hang
# the watchdog itself. Shapes, classified before any repair:
#   healthy + supervised: exit 0, silent.
#   healthy + unit file missing (the wiped-unit-dir case):
#     reinstall quietly, exit 0.
#   healthy + unit installed but not active: a foreign process
#     holds the port. Fail loud — the ladder never races a
#     process it does not supervise; an operator stops it.
#   down + unit absent at entry: install, then START (a unit
#     that was never loaded is started, not restarted), and
#     confirm on the long restore window — a fresh unit's
#     first start may sweep before the port binds.
#   down + unit loaded: RESTART — wedged (active, unresponsive)
#     and stopped alike — confirm on the ordinary window.
#   fallback: ops/serve.sh start, the direct path when no unit
#     could be installed, then confirm again.
# Exit 1: every rung failed, or the foreign shape — a failure
# note is appended to the state log and printed to stderr;
# surfacing it is the keeper's job. Invocation is by an
# external keeper polling every few minutes (downtime is
# bounded by that cadence plus ladder time); this repo ships
# the ladder, never a host-specific poller binding. Values
# come from the settings seam via backend.apps.ops_values.
#
# Test seams (env): FIELDKIT_UNIT_DIR, FIELDKIT_SYSTEMCTL,
# FIELDKIT_POLL_SECS (ordinary confirm window, default 60),
# FIELDKIT_RESTORE_POLL_SECS (fresh-restore window, 240),
# FIELDKIT_PROBE_SECS (hard probe budget, default 10).
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
RESTORE_POLL_SECS="${FIELDKIT_RESTORE_POLL_SECS:-240}"
PROBE_SECS="${FIELDKIT_PROBE_SECS:-10}"

healthy() {
  timeout "$PROBE_SECS" curl -s --max-time 5 -o /dev/null "$HEALTH_URL"
}

supervised_active() {
  "$SYSTEMCTL" is-active --quiet "$UNIT.service" 2>/dev/null
}

wait_healthy() {
  local deadline=$((SECONDS + $1))
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
UNIT_MISSING_AT_ENTRY=0
[[ -f "$UNIT_FILE" ]] || UNIT_MISSING_AT_ENTRY=1

if healthy; then
  if (( UNIT_MISSING_AT_ENTRY )); then
    install_quiet || fail "server healthy but unit reinstall failed"
    if supervised_active; then
      exit 0
    fi
    fail "port answers at $HEALTH_URL but the responder is not the supervised unit's process; stop the foreign process and the ladder will restore supervision"
  fi
  if supervised_active; then
    exit 0
  fi
  fail "port answers at $HEALTH_URL but the responder is not the supervised unit's process; stop the foreign process and the ladder will restore supervision"
fi

# Down. (Re)install first: idempotent, and it loads the unit.
if install_quiet; then
  if (( UNIT_MISSING_AT_ENTRY )); then
    VERB="start"
    WINDOW="$RESTORE_POLL_SECS"
  else
    VERB="restart"
    WINDOW="$POLL_SECS"
  fi
  "$SYSTEMCTL" "$VERB" "$UNIT.service" >>"$STATE_LOG" 2>&1 || true
  if wait_healthy "$WINDOW" && supervised_active; then
    exit 0
  fi
fi

# Fallback: the serve.sh path (direct start, or a retry).
bash "$OPS_DIR/serve.sh" start >>"$STATE_LOG" 2>&1 || true
if wait_healthy "$POLL_SECS"; then
  exit 0
fi

fail "restore ladder failed; server still unhealthy at $HEALTH_URL"
