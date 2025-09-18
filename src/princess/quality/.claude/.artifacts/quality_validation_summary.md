# quality Princess Domain Validation Report

Generated: 2025-09-18T12:02:05.174958

## Gate Results

- **Theater Detection Score**: FAIL (BLOCKING)
  - Value: 0
  - Threshold: >= 60.0

- **Test Coverage**: FAIL (BLOCKING)
  - Value: 0.0
  - Threshold: >= 80.0

- **Security Violations**: PASS (BLOCKING)
  - Value: 0
  - Threshold: >= 0

- **Linting Errors**: PASS (BLOCKING)
  - Value: 0
  - Threshold: >= 0

- **Type Checking**: FAIL (BLOCKING)
  - Value: 1
  - Threshold: >= 0

- **NASA POT10 Compliance**: FAIL (BLOCKING)
  - Value: 85.0
  - Threshold: >= 90.0

## DEPLOYMENT BLOCKED

The following blocking gates must pass before deployment:

- Theater Detection Score: 0 >= 60.0
- Test Coverage: 0.0 >= 80.0
- Type Checking: 1 >= 0
- NASA POT10 Compliance: 85.0 >= 90.0
