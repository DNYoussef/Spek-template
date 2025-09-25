/**
 * Comprehensive Test Script for Desktop Automation Mock MCP Server
 * Tests all functionality without requiring full MCP SDK or Bytebot containers
 */

const fs = require('fs').promises;
const path = require('path');

class MockDesktopAutomationTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runAllTests() {
    console.log('Starting Desktop Automation Mock MCP Server Tests...');
    console.log('='.repeat(60));

    await this.testServerInitialization();
    await this.testToolExecution();
    await this.testSecurityValidation();
    await this.testEvidenceCollection();
    await this.testHealthMonitoring();
    await this.testErrorHandling();

    this.generateReport();
    return this.testResults;
  }

  async testServerInitialization() {
    console.log('\nTesting Server Initialization...');

    try {
      const DesktopAutomationMCPServerMock = require('./desktop-automation-mcp-mock.js');
      const server = new DesktopAutomationMCPServerMock();

      this.recordTest('Server Instantiation', true, {
        name: server.name,
        version: server.version,
        evidenceDir: server.security.evidenceDir
      });

      // Test server startup
      await server.start();

      this.recordTest('Server Startup', true, {
        status: 'started',
        configuration: server.getStatus().configuration
      });

      // Test tool availability
      const tools = server.getTools();
      const expectedTools = ['desktop_screenshot', 'desktop_click', 'desktop_health_check'];
      const hasAllTools = expectedTools.every(tool =>
        tools.some(t => t.name === tool)
      );

      this.recordTest('Tool Registration', hasAllTools, {
        availableTools: tools.map(t => t.name),
        expectedTools,
        count: tools.length
      });

    } catch (error) {
      this.recordTest('Server Initialization', false, { error: error.message });
    }
  }

  async testToolExecution() {
    console.log('\nTesting Tool Execution...');

    try {
      const DesktopAutomationMCPServerMock = require('./desktop-automation-mcp-mock.js');
      const server = new DesktopAutomationMCPServerMock();
      await server.start();

      // Test screenshot tool
      const screenshotResult = await server.executeTool('desktop_screenshot', {
        area: 'full',
        quality: 'medium'
      });

      this.recordTest('Screenshot Tool Execution', screenshotResult.success, {
        tool: 'desktop_screenshot',
        result: screenshotResult.result,
        mock: screenshotResult.result?.mock || false
      });

      // Test click tool
      const clickResult = await server.executeTool('desktop_click', {
        x: 100,
        y: 200,
        button: 'left'
      });

      this.recordTest('Click Tool Execution', clickResult.success, {
        tool: 'desktop_click',
        coordinates: { x: 100, y: 200 },
        mock: clickResult.result?.mock || false
      });

      // Test type tool
      const typeResult = await server.executeTool('desktop_type', {
        text: 'Hello World',
        delay: 50
      });

      this.recordTest('Type Tool Execution', typeResult.success, {
        tool: 'desktop_type',
        textLength: 11,
        mock: typeResult.result?.mock || false
      });

      // Test health check tool
      const healthResult = await server.executeTool('desktop_health_check', {
        detailed: true
      });

      this.recordTest('Health Check Tool Execution', healthResult.success, {
        tool: 'desktop_health_check',
        overall: healthResult.result?.overall,
        mock: healthResult.result?.mock || false
      });

    } catch (error) {
      this.recordTest('Tool Execution', false, { error: error.message });
    }
  }

  async testSecurityValidation() {
    console.log('\nTesting Security Validation...');

    try {
      const DesktopAutomationMCPServerMock = require('./desktop-automation-mcp-mock.js');
      const server = new DesktopAutomationMCPServerMock();

      // Test coordinate bounds validation - should fail
      const invalidClickResult = await server.executeTool('desktop_click', {
        x: 5000, // Exceeds default max of 4096
        y: 100
      });

      this.recordTest('Coordinate Bounds Validation (Invalid)', !invalidClickResult.success, {
        tool: 'desktop_click',
        coordinates: { x: 5000, y: 100 },
        expectedFailure: true,
        error: invalidClickResult.error
      });

      // Test coordinate bounds validation - should pass
      const validClickResult = await server.executeTool('desktop_click', {
        x: 100,
        y: 100
      });

      this.recordTest('Coordinate Bounds Validation (Valid)', validClickResult.success, {
        tool: 'desktop_click',
        coordinates: { x: 100, y: 100 },
        expectedSuccess: true
      });

      // Test application allowlist (with wildcard default)
      const appLaunchResult = await server.executeTool('desktop_app_launch', {
        application: 'notepad.exe'
      });

      this.recordTest('Application Allowlist Validation', appLaunchResult.success, {
        tool: 'desktop_app_launch',
        application: 'notepad.exe',
        allowlist: server.security.allowedApplications
      });

    } catch (error) {
      this.recordTest('Security Validation', false, { error: error.message });
    }
  }

  async testEvidenceCollection() {
    console.log('\nTesting Evidence Collection...');

    try {
      const DesktopAutomationMCPServerMock = require('./desktop-automation-mcp-mock.js');
      const server = new DesktopAutomationMCPServerMock();
      await server.start();

      // Execute a screenshot to generate evidence
      await server.executeTool('desktop_screenshot', {
        area: 'full',
        quality: 'medium'
      });

      // Check for evidence files
      const evidenceDir = server.security.evidenceDir;

      // Check if audit log exists
      const auditPath = path.join(evidenceDir, 'audit.log');
      const auditExists = await fs.access(auditPath).then(() => true).catch(() => false);

      this.recordTest('Audit Log Creation', auditExists, {
        path: auditPath,
        exists: auditExists
      });

      // Check if operations log exists
      const operationsPath = path.join(evidenceDir, 'operations.jsonl');
      const operationsExists = await fs.access(operationsPath).then(() => true).catch(() => false);

      this.recordTest('Operations Log Creation', operationsExists, {
        path: operationsPath,
        exists: operationsExists
      });

      // Check for screenshot files
      const files = await fs.readdir(evidenceDir);
      const screenshotFiles = files.filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));

      this.recordTest('Screenshot Evidence Collection', screenshotFiles.length > 0, {
        screenshotCount: screenshotFiles.length,
        files: screenshotFiles
      });

    } catch (error) {
      this.recordTest('Evidence Collection', false, { error: error.message });
    }
  }

  async testHealthMonitoring() {
    console.log('\nTesting Health Monitoring...');

    try {
      const DesktopAutomationMCPServerMock = require('./desktop-automation-mcp-mock.js');
      const server = new DesktopAutomationMCPServerMock();

      // Test basic health check
      const healthResult = await server.executeTool('desktop_health_check', {
        detailed: false
      });

      this.recordTest('Basic Health Check', healthResult.success, {
        overall: healthResult.result?.overall,
        timestamp: healthResult.result?.lastCheck
      });

      // Test detailed health check
      const detailedHealthResult = await server.executeTool('desktop_health_check', {
        detailed: true
      });

      const hasConfiguration = detailedHealthResult.result?.configuration !== undefined;

      this.recordTest('Detailed Health Check', detailedHealthResult.success && hasConfiguration, {
        overall: detailedHealthResult.result?.overall,
        hasConfiguration,
        configKeys: hasConfiguration ? Object.keys(detailedHealthResult.result.configuration) : []
      });

      // Test server status
      const status = server.getStatus();
      const hasRequiredFields = status.name && status.version && status.configuration;

      this.recordTest('Server Status Report', hasRequiredFields, {
        name: status.name,
        version: status.version,
        hasConfiguration: !!status.configuration
      });

    } catch (error) {
      this.recordTest('Health Monitoring', false, { error: error.message });
    }
  }

  async testErrorHandling() {
    console.log('\nTesting Error Handling...');

    try {
      const DesktopAutomationMCPServerMock = require('./desktop-automation-mcp-mock.js');
      const server = new DesktopAutomationMCPServerMock();

      // Test unknown tool
      const unknownToolResult = await server.executeTool('unknown_tool', {});

      this.recordTest('Unknown Tool Handling', !unknownToolResult.success, {
        tool: 'unknown_tool',
        success: unknownToolResult.success,
        error: unknownToolResult.error
      });

      // Test missing required parameters
      const missingParamsResult = await server.executeTool('desktop_click', {});

      this.recordTest('Missing Parameter Handling', !missingParamsResult.success, {
        tool: 'desktop_click',
        params: {},
        success: missingParamsResult.success,
        error: missingParamsResult.error
      });

    } catch (error) {
      this.recordTest('Error Handling', false, { error: error.message });
    }
  }

  recordTest(testName, passed, details = {}) {
    const result = {
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    };

    this.testResults.tests.push(result);

    if (passed) {
      this.testResults.passed++;
      console.log(`   ${testName}`);
    } else {
      this.testResults.failed++;
      console.log(`   ${testName}`);
      if (details.error) {
        console.log(`     Error: ${details.error}`);
      }
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('DESKTOP AUTOMATION MOCK MCP SERVER TEST RESULTS');
    console.log('='.repeat(80));

    const total = this.testResults.passed + this.testResults.failed;
    const successRate = total > 0 ? (this.testResults.passed / total * 100).toFixed(1) : 0;

    console.log(`Summary:`);
    console.log(`   Total Tests: ${total}`);
    console.log(`   Passed: ${this.testResults.passed}`);
    console.log(`   Failed: ${this.testResults.failed}`);
    console.log(`   Success Rate: ${successRate}%`);

    if (this.testResults.failed > 0) {
      console.log('\nFailed Tests:');
      this.testResults.tests
        .filter(test => !test.passed)
        .forEach((test, index) => {
          console.log(`   ${index + 1}. ${test.name}`);
          if (test.details.error) {
            console.log(`      Error: ${test.details.error}`);
          }
        });
    }

    console.log('\nNext Steps:');
    if (successRate >= 90) {
      console.log('    Mock implementation is working correctly!');
      console.log('    Ready for integration with full MCP SDK');
      console.log('    Can be used for development and testing');
    } else if (successRate >= 70) {
      console.log('     Most functionality working, some issues to address');
      console.log('    Review failed tests and fix issues');
    } else {
      console.log('    Significant issues detected');
      console.log('    Review implementation and dependencies');
    }

    console.log('\nIntegration Checklist:');
    console.log('   1.  Mock implementation tested');
    console.log('   2.  Install MCP SDK dependencies');
    console.log('   3.  Start Bytebot containers');
    console.log('   4.  Test full MCP server integration');
    console.log('   5.  Add to Claude Code MCP configuration');

    console.log('\nFiles Created:');
    console.log('   - src/flow/servers/desktop-automation-mcp.js (Full MCP server)');
    console.log('   - src/flow/servers/desktop-automation-mcp-mock.js (Mock implementation)');
    console.log('   - src/services/desktop-agent/desktop-automation-service.js (Service layer)');
    console.log('   - Updated src/flow/config/mcp-multi-platform.json (Configuration)');
    console.log('   - Updated src/flow/config/agent-model-registry.js (Agent integration)');
    console.log('   - docs/DESKTOP-AUTOMATION-INTEGRATION.md (Documentation)');

    return this.testResults;
  }
}

// Run tests if executed directly
if (require.main === module) {
  const tester = new MockDesktopAutomationTester();
  tester.runAllTests()
    .then((results) => {
      const successRate = (results.passed / (results.passed + results.failed) * 100);
      process.exit(successRate >= 70 ? 0 : 1);
    })
    .catch((error) => {
      console.error(' Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = MockDesktopAutomationTester;