/**
 * Health Check Script for Desktop Automation MCP Server
 * Provides comprehensive system health monitoring
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class DesktopAutomationHealthCheck {
  constructor() {
    this.config = {
      bytebotDesktopUrl: process.env.BYTEBOT_DESKTOP_URL || 'http://localhost:9990',
      bytebotAgentUrl: process.env.BYTEBOT_AGENT_URL || 'http://localhost:9991',
      evidenceDir: process.env.EVIDENCE_DIR || '.claude/.artifacts/desktop',
      timeout: 5000
    };

    this.healthStatus = {
      overall: false,
      timestamp: new Date().toISOString(),
      components: {},
      recommendations: []
    };
  }

  async performHealthCheck() {
    console.log(' Performing Desktop Automation Health Check...\n');

    await this.checkBytebotServices();
    await this.checkMCPServerReadiness();
    await this.checkEvidenceInfrastructure();
    await this.checkSecurityConfiguration();
    await this.calculateOverallHealth();

    this.generateReport();

    return this.healthStatus;
  }

  async checkBytebotServices() {
    console.log(' Checking Bytebot Services...');

    // Check desktop service
    try {
      const startTime = Date.now();
      const response = await axios.get(`${this.config.bytebotDesktopUrl}/health`, {
        timeout: this.config.timeout
      });
      const responseTime = Date.now() - startTime;

      this.healthStatus.components.bytebotDesktop = {
        status: 'healthy',
        url: this.config.bytebotDesktopUrl,
        responseTime: `${responseTime}ms`,
        version: response.data.version || 'unknown',
        details: response.data
      };

      console.log(`   Desktop Service: ${this.config.bytebotDesktopUrl} (${responseTime}ms)`);

    } catch (error) {
      this.healthStatus.components.bytebotDesktop = {
        status: 'unhealthy',
        url: this.config.bytebotDesktopUrl,
        error: error.message,
        code: error.code
      };

      console.log(`   Desktop Service: ${error.message}`);\n      this.healthStatus.recommendations.push('Start Bytebot desktop container on port 9990');\n    }\n\n    // Check agent service\n    try {\n      const startTime = Date.now();\n      const response = await axios.get(`${this.config.bytebotAgentUrl}/health`, {\n        timeout: this.config.timeout\n      });\n      const responseTime = Date.now() - startTime;\n\n      this.healthStatus.components.bytebotAgent = {\n        status: 'healthy',\n        url: this.config.bytebotAgentUrl,\n        responseTime: `${responseTime}ms`,\n        version: response.data.version || 'unknown',\n        details: response.data\n      };\n\n      console.log(`   Agent Service: ${this.config.bytebotAgentUrl} (${responseTime}ms)`);\n\n    } catch (error) {\n      this.healthStatus.components.bytebotAgent = {\n        status: 'unhealthy',\n        url: this.config.bytebotAgentUrl,\n        error: error.message,\n        code: error.code\n      };\n\n      console.log(`   Agent Service: ${error.message}`);\n      this.healthStatus.recommendations.push('Start Bytebot agent container on port 9991');\n    }\n  }\n\n  async checkMCPServerReadiness() {\n    console.log('\\n Checking MCP Server Readiness...');\n\n    try {\n      // Check if server file exists\n      const serverPath = path.join(__dirname, 'desktop-automation-mcp.js');\n      const stats = await fs.stat(serverPath);\n\n      this.healthStatus.components.mcpServerFile = {\n        status: 'healthy',\n        path: serverPath,\n        size: `${(stats.size / 1024).toFixed(1)}KB`,\n        modified: stats.mtime.toISOString()\n      };\n\n      console.log(`   MCP Server File: ${serverPath}`);\n\n      // Test module loading\n      try {\n        const DesktopAutomationMCPServer = require('./desktop-automation-mcp.js');\n        const server = new DesktopAutomationMCPServer();\n\n        this.healthStatus.components.mcpServerModule = {\n          status: 'healthy',\n          className: server.constructor.name,\n          config: {\n            desktopUrl: server.bytebotConfig.desktopUrl,\n            agentUrl: server.bytebotConfig.agentUrl,\n            evidenceDir: server.security.evidenceDir\n          }\n        };\n\n        console.log('   MCP Server Module: Loaded successfully');\n\n      } catch (moduleError) {\n        this.healthStatus.components.mcpServerModule = {\n          status: 'unhealthy',\n          error: moduleError.message\n        };\n\n        console.log(`   MCP Server Module: ${moduleError.message}`);\n        this.healthStatus.recommendations.push('Check MCP server dependencies: npm install');\n      }\n\n    } catch (error) {\n      this.healthStatus.components.mcpServerFile = {\n        status: 'unhealthy',\n        error: error.message\n      };\n\n      console.log(`   MCP Server File: ${error.message}`);\n      this.healthStatus.recommendations.push('Ensure desktop-automation-mcp.js exists in servers directory');\n    }\n  }\n\n  async checkEvidenceInfrastructure() {\n    console.log('\\n Checking Evidence Infrastructure...');\n\n    try {\n      // Check evidence directory\n      const evidenceStats = await fs.stat(this.config.evidenceDir).catch(() => null);\n      \n      if (evidenceStats) {\n        this.healthStatus.components.evidenceDirectory = {\n          status: 'healthy',\n          path: this.config.evidenceDir,\n          created: evidenceStats.birthtime.toISOString(),\n          accessible: true\n        };\n\n        console.log(`   Evidence Directory: ${this.config.evidenceDir}`);\n      } else {\n        // Try to create evidence directory\n        await fs.mkdir(this.config.evidenceDir, { recursive: true });\n        \n        this.healthStatus.components.evidenceDirectory = {\n          status: 'healthy',\n          path: this.config.evidenceDir,\n          created: new Date().toISOString(),\n          accessible: true,\n          action: 'created'\n        };\n\n        console.log(`   Evidence Directory: Created ${this.config.evidenceDir}`);\n      }\n\n      // Test write permissions\n      const testFile = path.join(this.config.evidenceDir, 'health-check-test.json');\n      const testData = {\n        timestamp: new Date().toISOString(),\n        test: 'write-permission-check'\n      };\n\n      await fs.writeFile(testFile, JSON.stringify(testData, null, 2));\n      const readData = JSON.parse(await fs.readFile(testFile, 'utf8'));\n      \n      if (readData.test === 'write-permission-check') {\n        this.healthStatus.components.evidenceWritePermission = {\n          status: 'healthy',\n          testFile,\n          verified: true\n        };\n\n        console.log('   Evidence Write Permission: Verified');\n        \n        // Cleanup test file\n        await fs.unlink(testFile);\n      }\n\n    } catch (error) {\n      this.healthStatus.components.evidenceInfrastructure = {\n        status: 'unhealthy',\n        error: error.message\n      };\n\n      console.log(`   Evidence Infrastructure: ${error.message}`);\n      this.healthStatus.recommendations.push('Check file system permissions for evidence directory');\n    }\n  }\n\n  async checkSecurityConfiguration() {\n    console.log('\\n Checking Security Configuration...');\n\n    const securityChecks = {\n      coordinateBounds: {\n        name: 'Coordinate Bounds Validation',\n        check: () => {\n          const maxCoord = process.env.MAX_COORDINATE_VALUE || 4096;\n          return parseInt(maxCoord) > 0 && parseInt(maxCoord) <= 8192;\n        }\n      },\n      allowedApps: {\n        name: 'Application Allowlist',\n        check: () => {\n          const allowedApps = process.env.ALLOWED_APPS || '*';\n          return allowedApps.length > 0;\n        }\n      },\n      auditTrail: {\n        name: 'Audit Trail Configuration',\n        check: () => {\n          const auditEnabled = process.env.AUDIT_TRAIL !== 'false';\n          return auditEnabled;\n        }\n      },\n      securityMode: {\n        name: 'Security Mode',\n        check: () => {\n          const securityMode = process.env.SECURITY_MODE || 'strict';\n          return ['strict', 'normal', 'permissive'].includes(securityMode);\n        }\n      }\n    };\n\n    for (const [key, check] of Object.entries(securityChecks)) {\n      try {\n        const passed = check.check();\n        \n        this.healthStatus.components[`security_${key}`] = {\n          status: passed ? 'healthy' : 'warning',\n          check: check.name,\n          passed\n        };\n\n        console.log(`  ${passed ? '' : ' '} ${check.name}: ${passed ? 'OK' : 'Review needed'}`);\n        \n        if (!passed) {\n          this.healthStatus.recommendations.push(`Review ${check.name.toLowerCase()} configuration`);\n        }\n\n      } catch (error) {\n        this.healthStatus.components[`security_${key}`] = {\n          status: 'unhealthy',\n          check: check.name,\n          error: error.message\n        };\n\n        console.log(`   ${check.name}: ${error.message}`);\n      }\n    }\n  }\n\n  calculateOverallHealth() {\n    const components = Object.values(this.healthStatus.components);\n    const healthyCount = components.filter(c => c.status === 'healthy').length;\n    const totalCount = components.length;\n    \n    this.healthStatus.overall = healthyCount === totalCount;\n    this.healthStatus.healthScore = totalCount > 0 ? (healthyCount / totalCount * 100).toFixed(1) : 0;\n    \n    console.log(`\\n Overall Health Score: ${this.healthStatus.healthScore}% (${healthyCount}/${totalCount} components healthy)`);\n  }\n\n  generateReport() {\n    console.log('\\n' + '='.repeat(60));\n    console.log(' DESKTOP AUTOMATION HEALTH REPORT');\n    console.log('='.repeat(60));\n    console.log(`Timestamp: ${this.healthStatus.timestamp}`);\n    console.log(`Overall Status: ${this.healthStatus.overall ? ' HEALTHY' : ' NEEDS ATTENTION'}`);\n    console.log(`Health Score: ${this.healthStatus.healthScore}%`);\n\n    if (this.healthStatus.recommendations.length > 0) {\n      console.log('\\n Recommendations:');\n      this.healthStatus.recommendations.forEach((rec, index) => {\n        console.log(`${index + 1}. ${rec}`);\n      });\n    }\n\n    console.log('\\n Quick Start Commands:');\n    console.log('1. Start Bytebot: docker-compose up bytebot-desktop bytebot-agent');\n    console.log('2. Install dependencies: npm install');\n    console.log('3. Add MCP server: claude mcp add desktop-automation node src/flow/servers/desktop-automation-mcp.js');\n    console.log('4. Test connectivity: npm run test');\n    \n    console.log('\\n Documentation:');\n    console.log('- MCP Server: src/flow/servers/desktop-automation-mcp.js');\n    console.log('- Service: src/services/desktop-agent/desktop-automation-service.js');\n    console.log('- Config: src/flow/config/mcp-multi-platform.json');\n  }\n\n  async saveReport(outputPath) {\n    const reportPath = outputPath || path.join(this.config.evidenceDir, 'health-report.json');\n    \n    try {\n      await fs.mkdir(path.dirname(reportPath), { recursive: true });\n      await fs.writeFile(reportPath, JSON.stringify(this.healthStatus, null, 2));\n      \n      console.log(`\\n Health report saved: ${reportPath}`);\n      \n    } catch (error) {\n      console.error(`\\n Failed to save health report: ${error.message}`);\n    }\n  }\n}\n\n// Run health check if executed directly\nif (require.main === module) {\n  const healthCheck = new DesktopAutomationHealthCheck();\n  \n  healthCheck.performHealthCheck()\n    .then(async (status) => {\n      await healthCheck.saveReport();\n      process.exit(status.overall ? 0 : 1);\n    })\n    .catch((error) => {\n      console.error(' Health check failed:', error);\n      process.exit(1);\n    });\n}\n\nmodule.exports = DesktopAutomationHealthCheck;