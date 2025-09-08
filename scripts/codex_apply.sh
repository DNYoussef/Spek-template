#!/usr/bin/env bash
set -euo pipefail

# Use globally-installed Codex binary; override via env if needed.
CODEX_BIN="${CODEX_BIN:-codex}"
PLAN_JSON="${1:-}"            # path to a JSON plan OR empty (read from STDIN)
CONF="configs/codex.json"
BASE="${BASE:-main}"

if [[ -z "$PLAN_JSON" ]]; then
  PLAN_JSON="/dev/stdin"
fi

if ! command -v "$CODEX_BIN" >/dev/null 2>&1; then
  echo "ERROR: Codex CLI not found in PATH. Set CODEX_BIN or install Codex." >&2
  exit 127
fi

# Simple safety checks
git diff --quiet || { echo "ERROR: Working tree dirty. Commit/stash before Codex edits."; exit 1; }

# Create a throwaway sandbox branch (worktree) for safety
SBX_NAME="codex-sbx-$(date +%s)"
mkdir -p .sandboxes
git worktree add -b "$SBX_NAME" ".sandboxes/$SBX_NAME" "${BASE}" >/dev/null
pushd ".sandboxes/$SBX_NAME" >/dev/null

# Run Codex against the plan (stdin or file). We don't assume flags—use a single entrypoint.
# Map your actual Codex command here if it differs (e.g., "$CODEX_BIN exec ...").
# The wrapper ensures the rest of the system doesn't care about Codex CLI syntax.
cat "$PLAN_JSON" | "$CODEX_BIN" || true

# Basic diffstat for logging
echo "=== CODEX DIFFSTAT (sandbox) ==="
git status -s
git diff --stat || true

popd >/dev/null
echo "Sandbox branch: $SBX_NAME"