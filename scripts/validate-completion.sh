#!/usr/bin/env bash
set -euo pipefail
LIB="$(dirname "${BASH_SOURCE[0]:-$0}")/lib/cleanup-commons.sh"; [[ -f "$LIB" ]] && . "$LIB"
fail(){ echo "ERROR: $*" >&2; exit 1; }
TEST_CMD=${TEST_CMD:-"npm test --silent"}; TYPECHECK_CMD=${TYPECHECK_CMD:-"npm run typecheck"}
LINT_CMD=${LINT_CMD:-"npm run lint --silent"}; COVERAGE_CMD=${COVERAGE_CMD:-"npm run coverage"}
SECURITY_CMD=${SECURITY_CMD:-"semgrep --quiet --config p/owasp-top-ten --config configs/.semgrep.yml"}
CONNASCENCE_CMD=${CONNASCENCE_CMD:-"python -m analyzer.core --path . --policy nasa_jpl_pot10 --format json"}
[[ -f SPEC.md ]] || fail "SPEC.md not found"
unchecked="$(awk '/^##[[:space:]]*Acceptance/{f=1;next}/^##[[:space:]]/{f=0}f' SPEC.md | grep -E '^- \\[ \\]' || true)"
[[ -z "$unchecked" ]] || fail "SPEC.md has unchecked acceptance criteria"
echo "Typechecking..."; eval "$TYPECHECK_CMD"
echo "Linting..."; eval "$LINT_CMD"
echo "Running tests..."; eval "$TEST_CMD"
echo "Coverage..."; eval "$COVERAGE_CMD"
echo "Security scan..."; if command -v semgrep >/dev/null 2>&1; then eval "$SECURITY_CMD"; else echo "semgrep not found, skipping"; fi
echo "Analyzer..."; eval "$CONNASCENCE_CMD" >/dev/null
ci_ok=0; compgen -G ".github/workflows/*.yml" >/dev/null 2>&1 && ci_ok=1
[[ -f ".gitlab-ci.yml" || -f "azure-pipelines.yml" || -d ".circleci" ]] && ci_ok=1
[[ $ci_ok -eq 1 ]] || fail "No CI/CD configuration found"
echo "All validation gates passed."