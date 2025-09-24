# Agent Forge UI - Comprehensive Test Suite Documentation

## Overview

Comprehensive test suite for Agent Forge UI covering component testing, API integration, E2E scenarios, and performance validation.

## Test Structure

```
tests/
├── unit/                          # Component unit tests
│   └── ui/
│       ├── GrokfastMonitor.test.tsx
│       └── Phase5Dashboard.test.tsx
├── integration/                   # API integration tests
│   └── api/
│       └── grokfast_forge_api.test.py
├── e2e/                          # End-to-end tests
│   └── agent-forge-ui.test.ts
├── mocks/                        # Test fixtures and mocks
│   └── api-responses.ts
├── setup.ts                      # Test environment setup
├── test-runner.config.ts         # Jest/Playwright config
├── run-tests.sh                  # Main test execution script
└── test-results-summary.md       # Latest test results
```

## Quick Start

### Prerequisites

```bash
# Install dependencies
npm install
pip install pytest pytest-cov requests

# Install Playwright browsers
npx playwright install
```

### Run All Tests

```bash
# Execute complete test suite
chmod +x tests/run-tests.sh
./tests/run-tests.sh
```

### Run Specific Test Suites

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# With UI (Playwright)
npm run test:e2e:ui
```

### Watch Mode (Development)

```bash
npm run test:unit:watch
```

## Test Categories

### 1. Component Testing (Unit)

**GrokfastMonitor Component** (22 tests)
- ✅ Gradient history updates
- ✅ Lambda progress bar calculations
- ✅ Phase badge rendering
- ✅ Metric display formatting
- ✅ Error handling

**Phase5Dashboard Component** (23 tests)
- ✅ Metrics sections rendering
- ✅ Edge-of-chaos gauge calculations
- ✅ Self-modeling heatmap generation
- ✅ Dream cycle quality scoring
- ✅ Real-time updates

**Coverage Targets:**
- Statements: >80%
- Branches: >75%
- Functions: >80%
- Lines: >80%

### 2. API Integration Testing (32 tests)

**Endpoints Tested:**
- `/api/grokfast/metrics` - Gradient tracking
- `/api/forge/edge-controller/status` - Criticality monitoring
- `/api/forge/self-model/predictions` - Self-modeling predictions
- `/api/forge/dream/buffer` - Experience buffer
- `/api/forge/weight-trajectory` - Weight evolution

**Test Scenarios:**
- Response structure validation
- Data type verification
- Value range checking
- Error handling
- Concurrent request handling

### 3. E2E Testing (15 tests)

**Real-time Updates:**
- Polling intervals (1s, 2s)
- UI update synchronization
- State management

**Memory Leak Detection:**
- 5-minute continuous operation
- Memory growth monitoring
- Interval cleanup verification
- Re-render storm prevention

**API Failure Handling:**
- Network timeout
- Malformed responses
- Null/undefined data
- Extreme values
- Division by zero

## Test Execution

### Manual Execution

```bash
# Step 1: Start API server
cd api && python app.py

# Step 2: Start UI dev server
npm run dev

# Step 3: Run tests
./tests/run-tests.sh
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - uses: actions/setup-python@v4
      - run: npm ci
      - run: pip install -r requirements.txt
      - run: npm run test:ci
      - uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

## Edge Cases Tested

### Numeric Edge Cases
- ✅ Very large numbers (1e308)
- ✅ Very small numbers (1e-308)
- ✅ Negative values
- ✅ Division by zero (Infinity/NaN)
- ✅ Null/undefined values

### API Edge Cases
- ✅ Empty arrays
- ✅ Malformed JSON
- ✅ Network timeout
- ✅ API unreachable
- ✅ HTTP error codes
- ✅ Concurrent requests (50+)

### UI Edge Cases
- ✅ Memory leak scenarios
- ✅ Re-render storms
- ✅ Loading states
- ✅ Error boundaries

## Performance Benchmarks

### Memory Usage
- Initial: 45 MB
- Peak: 107 MB
- Growth Limit: <50 MB (over 5 min)

### API Response Times
- Average: <150ms
- 95th Percentile: <300ms
- Maximum: <500ms

### Rendering Performance
- Initial Render: <400ms
- Update Render: <20ms
- Re-renders (5 min): <100

## Test Results Interpretation

### Status Indicators
- ✅ **PASS** - Test passed successfully
- ❌ **FAIL** - Test failed, fix required
- ⚠️ **WARNING** - Test passed but performance/quality concerns

### Coverage Thresholds
- 🟢 **>85%** - Excellent
- 🟡 **80-85%** - Good, acceptable
- 🔴 **<80%** - Poor, improvement needed

## Common Issues & Solutions

### Issue: Tests Timing Out
**Solution:** Increase timeout in jest/playwright config
```typescript
test('...', async () => {
  // ...
}, 60000); // 60s timeout
```

### Issue: Memory Leak False Positive
**Solution:** Force garbage collection before measurement
```javascript
if (global.gc) global.gc();
```

### Issue: API Connection Refused
**Solution:** Ensure API server is running on correct port
```bash
lsof -i :8000  # Check port usage
```

### Issue: Flaky E2E Tests
**Solution:** Add explicit waits and retries
```typescript
await expect(element).toBeVisible({ timeout: 5000 });
```

## Mock Data

All mock API responses are centralized in `tests/mocks/api-responses.ts`:

```typescript
import {
  mockMetricsResponse,
  mockEdgeControllerResponse,
  generateProgressiveMetrics
} from './mocks/api-responses';

// Use in tests
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => mockMetricsResponse
});
```

## Custom Matchers

Extended Jest matchers for domain-specific assertions:

```typescript
// Range checking
expect(value).toBeWithinRange(0, 1);

// Gradient history validation
expect(gradientHistory).toHaveValidGradientHistory();
```

## Debugging Tests

### Debug Unit Tests
```bash
# Run in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Chrome DevTools
# Navigate to: chrome://inspect
```

### Debug E2E Tests
```bash
# Run with headed browser
npx playwright test --headed --debug

# Slow motion execution
npx playwright test --headed --slow-mo=1000
```

### Debug Integration Tests
```bash
# Verbose output
pytest tests/integration -vv -s

# Debug specific test
pytest tests/integration -k "test_metrics" --pdb
```

## Test Maintenance

### Adding New Tests

1. **Unit Test Template:**
```typescript
describe('NewComponent', () => {
  beforeEach(() => {
    // Setup
  });

  it('should handle edge case', () => {
    // Arrange
    const input = mockData;

    // Act
    render(<NewComponent {...input} />);

    // Assert
    expect(screen.getByText('result')).toBeInTheDocument();
  });
});
```

2. **Integration Test Template:**
```python
class TestNewEndpoint:
    def test_response_structure(self, api_client):
        response = api_client.get('/api/new/endpoint')
        assert response.status_code == 200
        assert 'expected_field' in response.json()
```

3. **E2E Test Template:**
```typescript
test('user flow', async ({ page }) => {
  await page.goto('/');
  await page.click('button');
  await expect(page.locator('.result')).toBeVisible();
});
```

### Updating Mocks

When API changes, update `tests/mocks/api-responses.ts`:

```typescript
export const mockNewEndpointResponse = {
  new_field: 'value',
  // ... other fields
};
```

### Reviewing Test Results

1. Check summary: `tests/test-results-summary.md`
2. Review HTML reports:
   - Coverage: `coverage/lcov-report/index.html`
   - Playwright: `playwright-report/index.html`
3. Analyze JSON results: `test-results/*.json`

## Best Practices

### DO ✅
- Use descriptive test names
- Test one thing per test
- Mock external dependencies
- Clean up after tests
- Use data-testid for stable selectors
- Test user behavior, not implementation

### DON'T ❌
- Test internal component state
- Use arbitrary waits (setTimeout)
- Share state between tests
- Skip error case testing
- Ignore flaky tests
- Hardcode test data

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Docs](https://playwright.dev/)
- [Pytest Documentation](https://docs.pytest.org/)

## Support

For test-related issues:
1. Check `tests/test-results-summary.md` for latest results
2. Review this README for common solutions
3. Run tests with verbose output: `npm run test:unit -- --verbose`
4. Create issue with test logs attached

---

**Last Updated:** 2024-01-15
**Test Suite Version:** 2.1.0
**Maintainer:** QA Team