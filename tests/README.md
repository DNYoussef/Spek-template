# Testing Doctrine - Black Box Only

## Core Principles

### 1. No Internal Peeking
- **Test public interfaces only** - never import internal modules
- **No direct access to private methods, fields, or implementation details**
- **Focus on behavior, not implementation structure**

### 2. Test Categories (in order of preference)

#### A. Property-Based Tests (`tests/property/`)
- **Highest value** - test invariants and edge cases automatically
- Use `fast-check` (JS/TS) or `hypothesis` (Python)
- Example: "sort function always produces ordered output"
- Example: "parser + serializer round-trip is identity"

#### B. Golden Master Tests (`tests/golden/`)
- **Regression protection** - capture known-good outputs
- Store fixtures and expected results
- Ideal for complex transformations, reports, analysis outputs
- Example: "connascence analyzer output for sample codebase"

#### C. Contract Tests (`tests/contract/`)
- **API compliance** - validate data shapes and interfaces  
- Use JSON Schema (Node) or Pydantic (Python) for validation
- Example: "API returns conformant OpenAPI spec"
- Example: "configuration file matches expected schema"

#### D. End-to-End Smoke Tests (`tests/e2e/`)
- **Integration validation** - full system behavior
- Minimal set covering critical user journeys
- Use real dependencies when possible
- Example: "full SPEC -> PR workflow completes successfully"

### 3. What NOT to Test
- [FAIL] **Unit tests of private methods** - implementation details change
- [FAIL] **Mocking internal components** - creates brittle coupling
- [FAIL] **Testing framework code** - focus on business logic
- [FAIL] **Configuration parsing** - use contract tests instead

### 4. Test Organization
```
tests/
[U+251C][U+2500][U+2500] property/           # Property-based invariant tests
[U+2502]   [U+251C][U+2500][U+2500] analyzer.test.ts
[U+2502]   [U+2514][U+2500][U+2500] workflows.test.ts
[U+251C][U+2500][U+2500] golden/             # Golden master / snapshot tests
[U+2502]   [U+251C][U+2500][U+2500] fixtures/       # Input test data
[U+2502]   [U+251C][U+2500][U+2500] expected/       # Golden outputs  
[U+2502]   [U+2514][U+2500][U+2500] runner.test.ts
[U+251C][U+2500][U+2500] contract/           # Schema/interface validation
[U+2502]   [U+251C][U+2500][U+2500] api.test.ts
[U+2502]   [U+2514][U+2500][U+2500] config.test.ts
[U+2514][U+2500][U+2500] e2e/               # End-to-end integration tests
    [U+2514][U+2500][U+2500] spec-to-pr.test.ts
```

### 5. Quality Standards
- **Coverage target**: 80%+ via public interface testing
- **Property test minimum**: 100 generated cases per property
- **Golden test updates**: Manual review required for changes
- **Contract evolution**: Backward compatibility checks

### 6. Test Data Management
- **Fixtures**: Version-controlled in `tests/golden/fixtures/`
- **Generators**: Property-based test data generators
- **Isolation**: Each test runs in clean environment
- **Repeatability**: Deterministic unless explicitly testing randomness

### 7. Performance Testing
- **Benchmark tests**: Measure and track performance regressions
- **Load tests**: Validate behavior under stress
- **Memory tests**: Check for leaks in long-running processes

## Examples

### Property Test Example
```typescript
// tests/property/sort.test.ts
import fc from 'fast-check';
import { sortNumbers } from '../src/utils';

describe('sortNumbers', () => {
  it('produces ordered output', () => {
    fc.assert(fc.property(
      fc.array(fc.integer()),
      (input) => {
        const sorted = sortNumbers(input);
        for (let i = 1; i < sorted.length; i++) {
          expect(sorted[i-1]).toBeLessThanOrEqual(sorted[i]);
        }
      }
    ));
  });
});
```

### Golden Test Example  
```typescript
// tests/golden/analyzer.test.ts
import { analyzeCode } from '../src/analyzer';
import { loadFixture, compareGolden } from './helpers';

describe('Code Analysis Golden Tests', () => {
  it('matches expected output for sample project', async () => {
    const input = loadFixture('sample-project');
    const result = await analyzeCode(input);
    
    await compareGolden('sample-project-analysis.json', result);
  });
});
```

### Contract Test Example
```typescript
// tests/contract/config.test.ts  
import { z } from 'zod';
import { loadConfig } from '../src/config';

const ConfigSchema = z.object({
  budgets: z.object({
    max_loc: z.number().positive(),
    max_files: z.number().positive()
  }),
  allowlist: z.array(z.string()),
  denylist: z.array(z.string())
});

describe('Configuration Contract', () => {
  it('validates against schema', () => {
    const config = loadConfig('configs/codex.json');
    expect(() => ConfigSchema.parse(config)).not.toThrow();
  });
});
```

**Remember: If you need to peek inside to test it, redesign the public interface instead.**