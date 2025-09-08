#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo .)"
cd "${1:-$ROOT}"

# Node/TS default; extend if python/mixed
if [[ -f package.json ]]; then
  npm test --silent
  npm run typecheck
  npm run lint --silent
fi

# Optional: run coverage in sandbox (fast smoke)
if [[ -f package.json ]]; then
  npm run coverage || true
fi