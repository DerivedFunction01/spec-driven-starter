#!/usr/bin/env bash
# The gate: line cap (800) + portability scan + test suite.
# Fail-fast; green is the definition of ready to land.
set -euo pipefail
cd "$(dirname "$0")"
export PATH="/usr/local/bin:/usr/bin:/bin:${PATH}"

echo "== line cap (800 lines per file)"
fail=0
while IFS= read -r file; do
  lines=$(wc -l < "$file")
  if [[ $lines -ge 800 ]]; then
    echo "LINE LIMIT: $file has $lines lines"
    fail=1
  fi
done < <(find . -type f \
  -not -path './.git/*' -not -path './var/*' -not -path './.venv/*' \
  -not -path './.plans/*' -not -path './workbench/*' \
  -not -name '*.pyc')
if [[ $fail -ne 0 ]]; then exit 1; fi
echo "line cap: ok"

echo "== portability scan"
python3 tools/portability_scan.py

echo "== test suite"
python3 -m unittest discover -s tests -t .

echo "check: green"
