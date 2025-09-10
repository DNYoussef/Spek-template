#!/usr/bin/env bash
# Cleanup Commons: safety helpers for post-completion cleanup (DRY_RUN/FORCE/ALLOWED_BASE)
set -Eeuo pipefail; IFS=$'\n\t'
: "${DRY_RUN:=0}" "${FORCE:=0}" "${ALLOWED_BASE:=}"
log(){ printf '%s\n' "$*"; }
warn(){ printf 'WARN: %s\n' "$*" >&2; }
die(){ printf 'ERROR: %s\n' "$*" >&2; exit 1; }
run(){ if [ "$DRY_RUN" = 1 ]; then log "[dry-run] $*"; else "$@"; fi; }
repo_root(){ git rev-parse --show-toplevel 2>/dev/null || pwd; }
canon(){ (cd "$(dirname -- "$1")" 2>/dev/null && printf '%s/%s\n' "$PWD" "$(basename -- "$1")") || return 1; }
is_safe(){ p="$(canon "$1")" || return 1; [ -n "$ALLOWED_BASE" ] && case "$p" in "$ALLOWED_BASE"/*) return 0;; esac; case "$p" in "$(repo_root)"/*) return 0;; esac; return 1; }
confirm(){ [ "$FORCE" = 1 ] && return 0; [ -t 0 ] || die "Refusing without TTY; use FORCE=1"; read -r -p "Proceed with cleanup? [y/N] " a; case "$a" in y|Y|yes|YES) ;; *) die "Aborted"; esac; }
safe_rm(){ [ $# -gt 0 ] || die "safe_rm: path required"; for t in "$@"; do is_safe "$t" || die "unsafe path: $t"; done; confirm; run rm -rf -- "$@"; }
with_lock(){ l="${TMPDIR:-/tmp}/cleanup.$(printf %s "$1"|tr '/\\' '__').lock"; shift; if mkdir "$l" 2>/dev/null; then trap 'rmdir "$l" 2>/dev/null || true' EXIT INT TERM; "$@"; else die "lock held: $l"; fi; }
require_cmd(){ command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"; }
trap 'st=$?; [ $st -eq 0 ] || warn "Cleanup step failed ($st)"' ERR
export -f log warn die run repo_root canon is_safe confirm safe_rm with_lock require_cmd