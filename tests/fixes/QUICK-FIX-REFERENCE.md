# Test Suite Quick Fix Reference

## Immediate Actions (Copy-Paste Ready)

### 1. Add Cleanup Hooks Template
```javascript
// For JavaScript/Jest tests
afterEach(async () => {
  if (instance) {
    await instance.shutdown(); // or cleanup()
  }
  await cleanupTestResources();
});

// For TypeScript/Jest tests
afterEach(async () => {
  if (instance) {
    await instance.shutdown();
  }
  await cleanupTestResources();
});

// For event emitters
afterEach(async () => {
  instance.removeAllListeners();
  await cleanupTestResources();
});
```

### 2. Replace setTimeout with Fake Timers
```javascript
// BAD
test('should wait', async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
});

// GOOD
jest.useFakeTimers();
test('should wait', async () => {
  const promise = someAsyncFunction();
  jest.advanceTimersByTime(1000);
  await promise;
});
afterEach(() => {
  jest.useRealTimers();
});
```

### 3. Convert done() to async/await
```javascript
// BAD
it('should emit event', (done) => {
  emitter.on('event', (data) => {
    expect(data).toBeDefined();
    done();
  });
  emitter.emit('event', { test: true });
});

// GOOD
it('should emit event', async () => {
  const promise = new Promise(resolve => {
    emitter.once('event', resolve);
  });
  emitter.emit('event', { test: true });
  const data = await promise;
  expect(data).toBeDefined();
});
```

### 4. Fix Theater Tests
```javascript
// BAD - Tautology
it('should monitor health', async () => {
  await manager.monitorHealth();
  expect(true).toBe(true); // Always passes!
});

// GOOD - Real validation
it('should monitor health', async () => {
  const healthReport = await manager.monitorHealth();
  expect(healthReport).toBeDefined();
  expect(healthReport.checks).toBeGreaterThan(0);
  expect(healthReport.timestamp).toBeDefined();
});
```

## File-Specific Quick Fixes

### swarmqueen-decomposition.test.ts - FIXED
Line 136 tautology replaced with real health check validation

### desktop-automation-service.test.js
**Line 14 - Fix Mocha/Jest mismatch:**
Change `this.timeout(30000)` to `jest.setTimeout(30000)`

**Line 361 - Fix 10s timeout mock:**
Replace setTimeout with immediate Promise.resolve

### enterprise-compliance-automation.test.ts
**Lines 200, 1130, 1263 - Replace setTimeout:**
Use jest.useFakeTimers() and jest.advanceTimersByTime()

## Priority Execution Order

### Phase 1: Emergency (4 hours - Day 1 PM)
1. [PASS] swarmqueen-decomposition.test.ts (30 min) - FIXED
2. [PASS] agent-registry-decomposition.test.js (30 min) - FIXED
3. [PASS] hiveprincess-decomposition.test.ts (30 min) - FIXED
4. desktop-automation-service.test.js (1 hour)
5. e2e/agent-forge-ui.test.ts (45 min)
6. deployment-orchestration/*.test.{js,ts} (1.5 hours)

## Quick Validation Commands

```bash
# Run single test file
npm test -- tests/unit/swarmqueen-decomposition.test.ts

# Run with leak detection
npm test -- --detectLeaks

# Run with coverage
npm test -- --coverage
```

## Files Already Fixed (2025-09-23 morning)
- [PASS] tests/unit/swarmqueen-decomposition.test.ts
- [PASS] tests/unit/agent-registry-decomposition.test.js
- [PASS] tests/unit/hiveprincess-decomposition.test.ts
- [PASS] tests/setup/test-environment.js (created)
- [PASS] jest.config.js (updated)