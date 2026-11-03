#!/usr/bin/env bash
# Start/stop the sample server.
#   ops/serve.sh start|stop|restart|status
# When the systemd unit is installed (ops/install-unit.sh), every
# verb delegates to systemctl — the unit is the supervisor, and a
# second direct instance must never race it for the port. Without
# the unit, the direct path applies: a background start with the
# pidfile and log under var/state/. Values (unit name, host,
# port) come from the settings seam via backend.apps.ops_values.
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
  echo "serve: settings values unavailable (build the venv first: python3 init_venv.py)" >&2
  exit 1
fi
UNIT_DIR="${FIELDKIT_UNIT_DIR:-/etc/systemd/system}"
SYSTEMCTL="${FIELDKIT_SYSTEMCTL:-systemctl}"
UNIT_FILE="$UNIT_DIR/$UNIT.service"
STATE_DIR="$ROOT/var/state"
LOG="$STATE_DIR/$UNIT.log"
PIDFILE="$STATE_DIR/$UNIT.pid"
URL="http://$HOST:$PORT"

unit_installed() {
  [[ -f "$UNIT_FILE" ]]
}

service_active() {
  "$SYSTEMCTL" is-active --quiet "$UNIT.service" 2>/dev/null
}

direct_pid() {
  if [[ -f "$PIDFILE" ]]; then
    local pid
    pid="$(cat "$PIDFILE")"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      printf '%s' "$pid"
      return 0
    fi
  fi
  return 1
}

case "${1:-}" in
  start)
    if unit_installed; then
      if service_active; then
        echo "server already running (systemd $UNIT.service) on $URL"
        exit 0
      fi
      "$SYSTEMCTL" start "$UNIT.service"
      if service_active; then
        echo "server started (systemd $UNIT.service) on $URL — log: $LOG"
      else
        echo "server failed to start via systemd; see $LOG" >&2
        exit 1
      fi
      exit 0
    fi
    if pid="$(direct_pid)"; then
      echo "server already running (pid $pid) on $URL"
      exit 0
    fi
    mkdir -p "$STATE_DIR"
    nohup "$PYTHON" -m backend.apps.server >>"$LOG" 2>&1 &
    echo $! > "$PIDFILE"
    sleep 1
    if pid="$(direct_pid)"; then
      echo "server started (pid $pid) on $URL — log: $LOG"
    else
      echo "server failed to start; see $LOG" >&2
      exit 1
    fi
    ;;
  stop)
    if unit_installed; then
      if service_active; then
        "$SYSTEMCTL" stop "$UNIT.service"
        echo "server stopped (systemd $UNIT.service)"
      else
        echo "server is not running"
      fi
      rm -f "$PIDFILE"
      exit 0
    fi
    if pid="$(direct_pid)"; then
      kill "$pid"
      rm -f "$PIDFILE"
      echo "server stopped (pid $pid)"
    else
      echo "server is not running"
      rm -f "$PIDFILE"
    fi
    ;;
  restart)
    if unit_installed; then
      "$SYSTEMCTL" restart "$UNIT.service"
      echo "server restarted (systemd $UNIT.service)"
      exit 0
    fi
    "$0" stop
    "$0" start
    ;;
  status)
    if unit_installed; then
      if service_active; then
        echo "server running (systemd $UNIT.service) on $URL"
      else
        echo "server not running"
      fi
      exit 0
    fi
    if pid="$(direct_pid)"; then
      echo "server running (pid $pid) on $URL"
    else
      echo "server not running"
    fi
    ;;
  *)
    echo "usage: $0 start|stop|restart|status" >&2
    exit 2
    ;;
esac
