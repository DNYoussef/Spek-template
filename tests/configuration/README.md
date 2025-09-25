# Configuration System Test Suite

Comprehensive validation testing for the enterprise configuration system, ensuring robust, reliable, and secure configuration management for the SPEK Enhanced Development Platform.

## Overview

This test suite provides extensive validation of the configuration system across multiple dimensions:

- **Schema Validation**: Ensures configuration structure and data types are correct
- **Migration Testing**: Validates backward compatibility with existing analyzer configurations  
- **Environment Overrides**: Tests environment-specific configuration handling
- **Performance Impact**: Measures and validates system performance under various loads
- **Six Sigma Integration**: Ensures proper integration with quality gates and DPMO calculations
- **Error Handling**: Tests resilience, recovery mechanisms, and graceful degradation

## Test Structure

```
tests/configuration/
 README.md                     # This documentation
 run-all-tests.js             # Comprehensive test runner
 validation-helpers.js        # Reusable validation utilities
 schema-validation.test.js     # Schema validation tests
 migration-testing.test.js     # Migration and compatibility tests
 environment-override.test.js  # Environment configuration tests
 performance-impact.test.js    # Performance and memory tests
 sixsigma-integration.test.js  # Six Sigma integration tests
 error-handling.test.js        # Error recovery and resilience tests
 fixtures/                    # Test data and scenarios
     mock-configs.js          # Mock configuration data
     test-scenarios.js        # Comprehensive test scenarios
```

## Running Tests

### Run All Tests
```bash
# Run the complete test suite
node tests/configuration/run-all-tests.js

# Or use npm/jest directly
npm test -- tests/configuration/
```

### Run Individual Test Categories

```bash
# Schema validation only
npx jest tests/configuration/schema-validation.test.js

# Migration testing only  
npx jest tests/configuration/migration-testing.test.js

# Environment overrides only
npx jest tests/configuration/environment-override.test.js

# Performance testing only
npx jest tests/configuration/performance-impact.test.js

# Six Sigma integration only
npx jest tests/configuration/sixsigma-integration.test.js

# Error handling only
npx jest tests/configuration/error-handling.test.js
```

### Verbose Output
```bash
# Run with detailed output
npx jest tests/configuration/ --verbose

# Run with coverage
npx jest tests/configuration/ --coverage
```

## Test Categories

### 1. Schema Validation Testing
**File**: `schema-validation.test.js`

- Validates enterprise_config.yaml structure
- Checks data types and constraints  
- Ensures required fields are present
- Validates enum values and ranges
- Tests cross-field constraints
- Verifies environment-specific configurations

Key test areas:
- Schema metadata validation
- Enterprise feature configuration
- Security settings validation
- Performance configuration
- Quality gates configuration
- Environment override validation

### 2. Migration Testing  
**File**: `migration-testing.test.js`

- Tests backward compatibility with analyzer config
- Validates legacy setting preservation
- Ensures smooth migration paths
- Verifies conflict resolution strategies

Key test areas:
- Legacy configuration preservation
- Detector configuration migration
- Analysis configuration migration  
- Migration compatibility validation
- Data integrity during migration

### 3. Environment Override Testing
**File**: `environment-override.test.js`

- Tests environment variable substitution
- Validates environment-specific overrides
- Tests configuration precedence
- Verifies runtime environment switching

Key test areas:
- Environment variable substitution
- Development/staging/production overrides
- Configuration precedence handling
- Runtime configuration switching
- Hot reloading capabilities

### 4. Performance Impact Testing
**File**: `performance-impact.test.js`

- Measures configuration loading performance
- Tests memory usage optimization
- Validates caching mechanisms
- Ensures scalable configuration access

Key test areas:
- Configuration loading performance
- Schema validation efficiency
- Runtime access performance
- Memory usage and garbage collection
- Configuration merge performance

### 5. Six Sigma Integration Testing
**File**: `sixsigma-integration.test.js`

- Validates integration with Six Sigma quality gates
- Tests DPMO calculation alignment
- Ensures theater detection integration
- Verifies process stage alignment

Key test areas:
- Configuration integration validation
- Quality gate alignment
- Process stage integration
- Theater detection integration
- Continuous improvement integration

### 6. Error Handling Testing
**File**: `error-handling.test.js`

- Tests error recovery mechanisms
- Validates graceful degradation
- Ensures system resilience
- Tests configuration validation errors

Key test areas:
- Configuration file loading errors
- Schema validation error handling  
- Runtime error recovery
- System recovery and health checks
- Validation error recovery

## Helper Utilities

### ConfigSchemaValidator
Provides comprehensive schema validation with:
- Type checking and constraint validation
- Cross-field constraint validation  
- Custom validation rules
- Detailed error reporting

### ConfigFileUtils
File system utilities for:
- YAML file loading with error handling
- File existence and permission validation
- Temporary configuration file creation

### EnvVarUtils  
Environment variable utilities for:
- Variable substitution in configuration
- Environment variable discovery
- Validation of required variables

### ConfigMerger
Configuration merging utilities for:
- Deep merging of configuration objects
- Environment override application
- Conflict resolution

### PerformanceUtils
Performance testing utilities for:
- Execution time measurement
- Memory usage analysis
- Performance benchmarking

### TestDataGenerator
Test data generation for:
- Valid enterprise configurations
- Invalid configuration scenarios
- Edge case testing data

## Test Data and Fixtures

### Mock Configurations
- **Valid Configs**: Complete, valid configuration examples
- **Invalid Configs**: Various invalid configuration scenarios  
- **Six Sigma Config**: Six Sigma quality gates configuration
- **Legacy Configs**: Historical analyzer configurations

### Test Scenarios  
- **Migration Scenarios**: Different migration paths and edge cases
- **Environment Scenarios**: Multi-environment configuration setups
- **Performance Scenarios**: Load testing and optimization scenarios
- **Error Scenarios**: Comprehensive error condition testing

## Quality Gates

The test suite enforces these quality gates:

### Coverage Requirements
- **Statement Coverage**: >90%
- **Branch Coverage**: >85%  
- **Function Coverage**: >95%
- **Line Coverage**: >90%

### Performance Requirements
- **Configuration Loading**: <100ms for typical configs
- **Schema Validation**: <50ms per validation
- **Environment Merging**: <20ms per merge operation
- **Memory Usage**: <10MB increase for typical operations

### Reliability Requirements
- **Error Recovery**: 100% of error conditions must be handled
- **Graceful Degradation**: System must continue with reduced functionality
- **Data Integrity**: No data loss during configuration operations

## NASA POT10 Compliance

This test suite supports NASA POT10 compliance requirements:

- **Comprehensive Documentation**: All test cases are fully documented
- **Traceability**: Each test maps to specific requirements
- **Error Handling**: Complete error condition coverage
- **Performance Validation**: System performance is validated under load
- **Security Testing**: Configuration security is thoroughly tested

## Integration with CI/CD

The test suite integrates with CI/CD pipelines:

```bash
# In your CI/CD pipeline
npm install
npm run test:configuration

# Check exit code for pass/fail status
if [ $? -eq 0 ]; then
    echo "Configuration tests passed"
else  
    echo "Configuration tests failed"
    exit 1
fi
```

## Troubleshooting

### Common Issues

**Test file not found errors**:
- Ensure all test files are in the correct directory
- Check file permissions and accessibility

**Environment variable issues**:
- Set required environment variables for testing
- Use test fixtures for consistent test environments

**Performance test failures**:
- Check system load during test execution
- Adjust performance thresholds if needed for CI environment

**Schema validation failures**:  
- Verify configuration file syntax is correct
- Check that all required fields are present

### Debug Mode
```bash
# Run tests with debugging enabled
DEBUG=config-test npx jest tests/configuration/

# Run with Node.js debugging
node --inspect-brk node_modules/.bin/jest tests/configuration/
```

## Contributing

When adding new configuration features:

1. **Add Schema Tests**: Update schema validation tests for new fields
2. **Add Migration Tests**: Ensure backward compatibility
3. **Add Performance Tests**: Validate performance impact
4. **Update Mock Data**: Add test fixtures for new scenarios
5. **Update Documentation**: Keep this README current

### Test Writing Guidelines

- **Test Names**: Use descriptive test names that explain the behavior
- **Test Structure**: Follow Arrange-Act-Assert pattern
- **Error Testing**: Always test both success and failure cases
- **Performance**: Include performance assertions for critical paths
- **Documentation**: Document complex test scenarios

## Reporting

The test runner generates comprehensive reports:

- **JSON Report**: `test-results.json` - Machine-readable results
- **Markdown Summary**: `TEST-SUMMARY.md` - Human-readable summary  
- **Console Output**: Detailed real-time test progress

## Security Considerations

The test suite includes security validations:

- **Sensitive Data**: Tests ensure no secrets are logged or exposed
- **Access Control**: Validates role-based configuration access
- **Audit Trail**: Tests configuration change auditing
- **Encryption**: Validates encryption settings and key management

---

## Next Steps

After running the configuration tests:

1. **Review Results**: Check test summary for any failures
2. **Address Issues**: Fix any failing tests before deployment
3. **Performance Tuning**: Optimize any performance bottlenecks identified  
4. **Documentation**: Update configuration documentation as needed
5. **Deployment**: Proceed with deployment once all tests pass

The configuration system test suite ensures robust, reliable, and secure configuration management for enterprise deployment.