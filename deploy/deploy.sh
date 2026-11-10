#!/usr/bin/env bash
# deploy.sh — build, publish, and health-check, in that
# order, against a LOCAL target directory. This is the reference
# implementation of the deploy contract in deploy/DEPLOY.md:
# any real host supplies its own publish step behind the same
# three stages, and a stage that fails stops the deploy.
#
#   deploy/deploy.sh [--target DIR]   (default: var/serve)
set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:${PATH}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="$ROOT/var/serve"
if [[ "${1:-}" == "--target" && -n "${2:-}" ]]; then TARGET="$2"; fi
cd "$ROOT"

echo "== stage 1: build environment"
python3 init_venv.py

echo "== stage 2: publish (local target)"
mkdir -p "$TARGET"
cp -r backend frontend "$TARGET/"

echo "== stage 3: health check against the target"
FIELDKIT_PORT="${FIELDKIT_PORT:-8798}" "$ROOT/var/venv/bin/python" \
  -m backend.apps.server &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT
for _ in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fs "http://127.0.0.1:${FIELDKIT_PORT:-8798}/health" >/dev/null; then
    echo "deploy: ok (target $TARGET)"
    exit 0
  fi
  sleep 1
done
echo "deploy: health check failed" >&2
exit 1
