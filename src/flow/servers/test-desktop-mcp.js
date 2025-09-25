/**
 * Test script for Desktop Automation MCP Server
 * Tests connectivity and basic functionality
 */

const axios = require('axios');
const path = require('path');

class DesktopMCPTester {
  constructor() {
    this.config = {
      bytebotDesktopUrl: process.env.BYTEBOT_DESKTOP_URL || 'http://localhost:9990',
      bytebotAgentUrl: process.env.BYTEBOT_AGENT_URL || 'http://localhost:9991',
      mcpServerPort: process.env.MCP_SERVER_PORT || 9995,
      evidenceDir: process.env.EVIDENCE_DIR || '.claude/.artifacts/desktop'
    };

    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runTests() {
    console.log('Starting Desktop Automation MCP Server Tests...\n');

    await this.testBytebotConnectivity();
    await this.testMCPServerConfiguration();
    await this.testSecurityValidation();
    await this.testEvidenceCollection();

    this.printResults();
  }

  async testBytebotConnectivity() {
    console.log('Testing Bytebot Connectivity...');

    // Test desktop endpoint
    try {
      const response = await axios.get(`${this.config.bytebotDesktopUrl}/health`, {
        timeout: 5000
      });

      this.recordTest('Bytebot Desktop Health Check', true, {
        status: response.status,
        version: response.data.version || 'unknown'
      });

    } catch (error) {
      this.recordTest('Bytebot Desktop Health Check', false, {
        error: error.message,
        suggestion: 'Ensure Bytebot desktop container is running on port 9990'
      });
    }

    // Test agent endpoint
    try {
      const response = await axios.get(`${this.config.bytebotAgentUrl}/health`, {
        timeout: 5000
      });

      this.recordTest('Bytebot Agent Health Check', true, {
        status: response.status,
        version: response.data.version || 'unknown'
      });

    } catch (error) {
      this.recordTest('Bytebot Agent Health Check', false, {
        error: error.message,
        suggestion: 'Ensure Bytebot agent container is running on port 9991'
      });
    }
  }

  async testMCPServerConfiguration() {
    console.log('Testing MCP Server Configuration...');

    try {
      // Test if MCP server file exists
      const DesktopAutomationMCPServer = require('./desktop-automation-mcp.js');

      this.recordTest('MCP Server Module Load', true, {
        message: 'Desktop Automation MCP Server module loaded successfully'
      });

      // Test server instantiation
      const server = new DesktopAutomationMCPServer();

      this.recordTest('MCP Server Instantiation', true, {
        message: 'Server instance created successfully',
        config: {
          desktopUrl: server.bytebotConfig.desktopUrl,
          agentUrl: server.bytebotConfig.agentUrl,
          evidenceDir: server.security.evidenceDir
        }
      });

    } catch (error) {
      this.recordTest('MCP Server Configuration', false, {
        error: error.message,
        suggestion: 'Check if all required dependencies are installed'
      });
    }
  }

  async testSecurityValidation() {
    console.log('Testing Security Validation...');

    try {
      const DesktopAutomationMCPServer = require('./desktop-automation-mcp.js');
      const server = new DesktopAutomationMCPServer();

      // Test coordinate bounds validation
      try {
        await server.validateSecurity('desktop_click', { x: 5000, y: 100 });
        this.recordTest('Security Coordinate Bounds Check', false, {
          message: 'Should have rejected coordinates exceeding bounds'
        });
      } catch (error) {
        this.recordTest('Security Coordinate Bounds Check', true, {
          message: 'Correctly rejected out-of-bounds coordinates'
        });
      }

      // Test valid coordinates
      await server.validateSecurity('desktop_click', { x: 100, y: 100 });
      this.recordTest('Security Valid Coordinates', true, {
        message: 'Correctly accepted valid coordinates'
      });

    } catch (error) {
      this.recordTest('Security Validation', false, {
        error: error.message
      });
    }
  }

  async testEvidenceCollection() {
    console.log('Testing Evidence Collection...');

    try {
      const fs = require('fs').promises;

      // Test evidence directory creation
      await fs.mkdir(this.config.evidenceDir, { recursive: true });

      this.recordTest('Evidence Directory Creation', true, {
        path: this.config.evidenceDir
      });

      // Test audit log functionality
      const testLogEntry = {
        timestamp: new Date().toISOString(),
        operation: 'test_operation',
        sessionId: 'test-session'
      };

      const logPath = path.join(this.config.evidenceDir, 'test-audit.log');
      await fs.writeFile(logPath, JSON.stringify(testLogEntry) + '\n');

      const logContent = await fs.readFile(logPath, 'utf8');
      const parsedEntry = JSON.parse(logContent.trim());

      if (parsedEntry.operation === 'test_operation') {
        this.recordTest('Evidence Logging', true, {
          message: 'Successfully created and read audit log'
        });
      } else {
        this.recordTest('Evidence Logging', false, {
          message: 'Log entry data mismatch'
        });
      }

      // Cleanup test file
      await fs.unlink(logPath);

    } catch (error) {
      this.recordTest('Evidence Collection', false, {
        error: error.message
      });
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
      console.log(`[OK] ${testName}`);
    } else {
      this.testResults.failed++;
      console.log(`[FAIL] ${testName}`);
      if (details.error) {
        console.log(`   Error: ${details.error}`);
      }
      if (details.suggestion) {
        console.log(`   Suggestion: ${details.suggestion}`);
      }
    }
  }

  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('DESKTOP AUTOMATION MCP TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${this.testResults.passed + this.testResults.failed}`);
    console.log(`Passed: ${this.testResults.passed}`);
    console.log(`Failed: ${this.testResults.failed}`);
    console.log(`Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);

    if (this.testResults.failed > 0) {
      console.log('\nFailed Tests:');
      this.testResults.tests
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`- ${test.name}: ${test.details.error || 'Unknown error'}`);
        });
    }

    console.log('\nNext Steps:');
    console.log('1. Ensure Bytebot containers are running');
    console.log('2. Install required dependencies: npm install');
    console.log('3. Configure environment variables as needed');
    console.log('4. Run: claude mcp add desktop-automation node src/flow/servers/desktop-automation-mcp.js');
  }
}

// Run tests if executed directly
if (require.main === module) {
  const tester = new DesktopMCPTester();
  tester.runTests().catch(console.error);
}

module.exports = DesktopMCPTester;