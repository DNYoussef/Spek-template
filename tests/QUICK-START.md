# Agent Forge UI - Test Quick Start

## Install & Setup (5 minutes)

```bash
# 1. Install Node dependencies
npm install

# 2. Install Python dependencies
pip install pytest pytest-cov requests

# 3. Install Playwright browsers
npx playwright install

# 4. Make test runner executable
chmod +x tests/run-tests.sh
```

## Run Tests (Choose One)

### Option 1: Run Everything (8 minutes)
```bash
./tests/run-tests.sh
```

### Option 2: Run Individual Suites

```bash
# Unit tests (React components) - 2 minutes
npm run test:unit

# Integration tests (API endpoints) - 3 minutes
npm run test:integration

# E2E tests (Playwright) - 4 minutes
npm run test:e2e
```

### Option 3: Development Mode
```bash
# Watch mode - re-runs on file change
npm run test:unit:watch

# E2E with UI - visual debugging
npm run test:e2e:ui
```

## Quick Results

After running tests, check:

1. **Console Output** - Live test results
2. **Summary Report** - `tests/test-results-summary.md`
3. **Coverage Report** - `coverage/lcov-report/index.html`
4. **Playwright Report** - `playwright-report/index.html`

## Current Status

```
Total Tests: 92
Passed:      79 (85.9%)
Failed:      13 (14.1%)
Coverage:    86.2%
```

## Key Failures to Fix

### Critical (6 hours total effort)
1. **Memory Leak** (2 hours)
   - File: `src/components/GrokfastMonitor.tsx`
   - Fix: Implement circular buffer for gradient_history

2. **Re-render Storm** (4 hours)
   - Files: `Phase5Dashboard.tsx`, `GrokfastMonitor.tsx`
   - Fix: Add React.memo and useMemo

### Medium Priority (2 hours)
3. **Division by Zero** (1 hour)
   - File: `src/utils/formatters.ts`
   - Fix: Add Number.isFinite() check

4. **Value Clamping** (1 hour)
   - Files: All metric display components
   - Fix: Add min/max constraints

## Test Files Created

```
tests/
 unit/ui/
    GrokfastMonitor.test.tsx       (22 tests)
    Phase5Dashboard.test.tsx       (23 tests)
 integration/api/
    grokfast_forge_api.test.py     (32 tests)
 e2e/
    agent-forge-ui.test.ts         (15 tests)
 mocks/
    api-responses.ts               (Test fixtures)
 setup.ts                            (Test environment)
 test-runner.config.ts               (Jest/Playwright config)
 run-tests.sh                        (Main test runner)
 package.json                        (NPM scripts)
```

## Debugging Failed Tests

### View Detailed Failures
```bash
# Unit tests with verbose output
npm run test:unit -- --verbose

# Integration tests with stack traces
pytest tests/integration -vv -s

# E2E tests with browser visible
npx playwright test --headed --debug
```

### Common Issues

**Issue:** `ECONNREFUSED` on API tests
```bash
# Solution: Start API server first
cd api && python app.py &
```

**Issue:** Playwright browser not found
```bash
# Solution: Reinstall browsers
npx playwright install --force
```

**Issue:** Permission denied on run-tests.sh
```bash
# Solution: Make executable
chmod +x tests/run-tests.sh
```

## Next Steps

1. Review: `docs/AGENT-FORGE-TEST-SUMMARY.md`
2. Fix critical issues (6 hours)
3. Re-run tests: `./tests/run-tests.sh`
4. Deploy to staging

---

**Questions?** Check `tests/AGENT-FORGE-TEST-SUITE.md` for full documentation.