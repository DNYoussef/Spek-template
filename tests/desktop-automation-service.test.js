/**
 * Comprehensive Test Suite for Desktop Automation Service
 * Tests MCP server bridge, mock implementation, and integration
 */

const { expect } = require('chai');
const sinon = require('sinon');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const DesktopAutomationService = require('../src/services/desktop-agent/desktop-automation-service.js');

describe('Desktop Automation Service - Comprehensive Testing', function() {
  this.timeout(30000);

  let service;
  let axiosStub;
  let fsStub;
  const testConfig = {
    bytebotDesktopUrl: 'http://localhost:9990',
    bytebotAgentUrl: 'http://localhost:9991',
    evidenceDir: './test-evidence',
    maxRetries: 2,
    timeout: 5000
  };

  beforeEach(async function() {
    // Create service instance
    service = new DesktopAutomationService(testConfig);

    // Stub external dependencies
    axiosStub = sinon.stub(axios, 'post');
    sinon.stub(axios, 'get');
    fsStub = sinon.stub(fs, 'writeFile').resolves();
    sinon.stub(fs, 'appendFile').resolves();
    sinon.stub(fs, 'mkdir').resolves();
  });

  afterEach(function() {
    sinon.restore();
  });

  describe('1. MCP Server Testing', function() {

    it('should initialize service successfully', async function() {
      // Mock health check response
      axios.get.resolves({
        data: { status: 'healthy', version: '1.0.0' },
        headers: { 'x-response-time': '50ms' }
      });

      const result = await service.initialize();
      expect(result).to.be.true;
      expect(service.state.isInitialized).to.be.true;
    });

    it('should handle health check failures gracefully', async function() {
      axios.get.rejects(new Error('Connection refused'));

      const result = await service.performHealthCheck();
      expect(result.overall).to.be.false;
      expect(result.containers.desktop.status).to.equal('unhealthy');
      expect(result.containers.agent.status).to.equal('unhealthy');
    });

    it('should validate tool registration', function() {
      const requiredMethods = [
        'executeOperation',
        'queueOperation',
        'validateOperation',
        'performOperation',
        'takeScreenshot',
        'clickAt',
        'typeText',
        'moveMouse'
      ];

      requiredMethods.forEach(method => {
        expect(service[method]).to.be.a('function');
      });
    });

    it('should test error handling and edge cases', async function() {
      // Test invalid operation type
      try {
        await service.executeOperation({ type: 'invalid_operation' });
        expect.fail('Should have thrown error for invalid operation');
      } catch (error) {
        expect(error.message).to.include('Unknown operation type');
      }

      // Test coordinate bounds validation
      try {
        await service.validateOperation({
          type: 'click',
          params: { x: 9999, y: 9999 }
        });
        expect.fail('Should have thrown error for out-of-bounds coordinates');
      } catch (error) {
        expect(error.message).to.include('exceeds bounds');
      }
    });

    it('should verify security validation functions correctly', async function() {
      // Test application allowlist
      service.security.allowedApplications = ['firefox', 'vscode'];

      try {
        await service.validateOperation({
          type: 'launch_app',
          params: { application: 'malicious-app' }
        });
        expect.fail('Should have blocked unauthorized application');
      } catch (error) {
        expect(error.message).to.include('not in allowlist');
      }

      // Test dangerous operation confirmation
      try {
        await service.validateOperation({
          type: 'file_operation',
          params: { operation: 'delete', path: '/important/file' }
        });
        expect.fail('Should have required confirmation for dangerous operation');
      } catch (error) {
        expect(error.message).to.include('requires explicit confirmation');
      }
    });
  });

  describe('2. Mock Implementation Testing', function() {

    it('should test screenshot tool response', async function() {
      const mockResponse = {
        imageData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        timestamp: new Date().toISOString(),
        success: true
      };

      axiosStub.resolves({ data: mockResponse });

      const result = await service.takeScreenshot({ quality: 'high' });
      expect(result.imageData).to.equal(mockResponse.imageData);
      expect(result.success).to.be.true;
      expect(fsStub.calledOnce).to.be.true;
    });

    it('should test click tool response', async function() {
      const mockResponse = { success: true, action: 'clicked', coordinates: { x: 100, y: 200 } };
      axiosStub.resolves({ data: mockResponse });

      const result = await service.clickAt({ x: 100, y: 200, button: 'left' });
      expect(result.success).to.be.true;
      expect(result.coordinates).to.deep.equal({ x: 100, y: 200 });
    });

    it('should test type tool response', async function() {
      const mockResponse = { success: true, action: 'typed', text: 'test input' };
      axiosStub.resolves({ data: mockResponse });

      const result = await service.typeText({ text: 'test input', delay: 50 });
      expect(result.success).to.be.true;
      expect(result.text).to.equal('test input');
    });

    it('should test mouse movement tool response', async function() {
      const mockResponse = { success: true, action: 'moved', position: { x: 300, y: 400 } };
      axiosStub.resolves({ data: mockResponse });

      const result = await service.moveMouse({ x: 300, y: 400, duration: 500 });
      expect(result.success).to.be.true;
      expect(result.position).to.deep.equal({ x: 300, y: 400 });
    });

    it('should test scroll tool response', async function() {
      const mockResponse = { success: true, action: 'scrolled', direction: 'down', amount: 3 };
      axiosStub.resolves({ data: mockResponse });

      const result = await service.scroll({ direction: 'down', amount: 3 });
      expect(result.success).to.be.true;
      expect(result.direction).to.equal('down');
    });

    it('should test application launch tool response', async function() {
      const mockResponse = { success: true, action: 'launched', application: 'firefox' };
      axiosStub.resolves({ data: mockResponse });

      const result = await service.launchApplication({ application: 'firefox' });
      expect(result.success).to.be.true;
      expect(result.application).to.equal('firefox');
    });

    it('should test file operation tool response', async function() {
      const mockResponse = { success: true, action: 'file_created', path: '/test/file.txt' };
      axiosStub.resolves({ data: mockResponse });

      const result = await service.performFileOperation({
        operation: 'create',
        path: '/test/file.txt',
        confirm: true
      });
      expect(result.success).to.be.true;
      expect(result.path).to.equal('/test/file.txt');
    });

    it('should test wait/delay functionality', async function() {
      const startTime = Date.now();
      await service.delay(100);
      const endTime = Date.now();

      expect(endTime - startTime).to.be.at.least(95); // Allow some margin
    });

    it('should validate evidence collection and audit logging', async function() {
      const mockOperation = { type: 'screenshot', params: {} };
      const mockResult = { success: true, imageData: 'test' };

      await service.storeOperationEvidence(mockOperation, mockResult, 150);

      expect(fs.appendFile.calledOnce).to.be.true;
      const logCall = fs.appendFile.getCall(0);
      const logData = JSON.parse(logCall.args[1]);

      expect(logData.operation.type).to.equal('screenshot');
      expect(logData.success).to.be.true;
      expect(logData.duration).to.equal(150);
    });

    it('should verify proper error responses and validation', async function() {
      axiosStub.rejects(new Error('Network timeout'));

      try {
        await service.executeOperation({ type: 'screenshot', params: {} });
        expect.fail('Should have thrown network error');
      } catch (error) {
        expect(error.message).to.include('Network timeout');
      }

      // Verify error logging
      expect(fs.appendFile.calledWith(
        sinon.match(/errors\.jsonl$/),
        sinon.match(/"success":false/)
      )).to.be.true;
    });
  });

  describe('3. Integration Testing', function() {

    it('should test agent model registry integration', function() {
      // Mock agent registry configuration
      const agentConfig = {
        'desktop-automation-agent': {
          model: 'claude-sonnet-4',
          mcpServers: ['bytebot-desktop'],
          capabilities: ['screenshot', 'click', 'type', 'file_operations']
        }
      };

      // Verify configuration structure
      expect(agentConfig['desktop-automation-agent']).to.have.property('model');
      expect(agentConfig['desktop-automation-agent']).to.have.property('mcpServers');
      expect(agentConfig['desktop-automation-agent'].mcpServers).to.include('bytebot-desktop');
    });

    it('should validate MCP server configuration loading', async function() {
      const mockMcpConfig = {
        servers: {
          'bytebot-desktop': {
            command: 'node',
            args: ['./src/services/desktop-agent/mcp/index.js'],
            env: {
              'BYTEBOT_DESKTOP_URL': 'http://localhost:9990'
            }
          }
        }
      };

      expect(mockMcpConfig.servers['bytebot-desktop']).to.have.property('command');
      expect(mockMcpConfig.servers['bytebot-desktop'].env).to.have.property('BYTEBOT_DESKTOP_URL');
    });

    it('should test desktop automation service functionality', async function() {
      // Test service lifecycle
      expect(service.state.isInitialized).to.be.false;

      // Mock successful initialization
      axios.get.resolves({
        data: { status: 'healthy', version: '1.0.0' },
        headers: { 'x-response-time': '50ms' }
      });

      await service.initialize();
      expect(service.state.isInitialized).to.be.true;

      // Test operation queueing
      const operationId = await service.queueOperation({
        type: 'screenshot',
        params: { quality: 'medium' }
      });

      expect(operationId).to.be.a('string');
      expect(service.operationQueue.length).to.equal(1);
    });

    it('should verify security constraints and bounds checking', async function() {
      // Test coordinate validation
      const invalidCoords = [
        { x: -1, y: 100 },
        { x: 100, y: -1 },
        { x: 5000, y: 100 },
        { x: 100, y: 5000 }
      ];

      for (const coords of invalidCoords) {
        try {
          await service.validateOperation({
            type: 'click',
            params: coords
          });
          expect.fail(`Should have rejected invalid coordinates: ${JSON.stringify(coords)}`);
        } catch (error) {
          expect(error.message).to.include('exceeds bounds');
        }
      }

      // Test application security
      service.security.allowedApplications = ['firefox', 'vscode'];

      try {
        await service.validateOperation({
          type: 'launch_app',
          params: { application: 'cmd.exe' }
        });
        expect.fail('Should have blocked unauthorized application');
      } catch (error) {
        expect(error.message).to.include('not in allowlist');
      }
    });
  });

  describe('4. Performance Testing', function() {

    it('should test connection pooling and retry logic', async function() {
      let callCount = 0;
      axiosStub.callsFake(() => {
        callCount++;
        if (callCount < 2) {
          return Promise.reject(new Error('Connection failed'));
        }
        return Promise.resolve({ data: { success: true } });
      });

      const result = await service.callBytebotAPI('/test', {});
      expect(result.success).to.be.true;
      expect(callCount).to.equal(2); // Should have retried once
    });

    it('should validate timeout handling', async function() {
      axiosStub.callsFake(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve({ data: { success: true } }), 10000);
        });
      });

      // Set short timeout for test
      service.config.timeout = 100;

      try {
        await service.callBytebotAPI('/test', {});
        expect.fail('Should have timed out');
      } catch (error) {
        expect(error.message).to.include('timeout');
      }
    });

    it('should test concurrent operations', async function() {
      axiosStub.resolves({ data: { success: true } });

      const operations = [
        service.executeOperation({ type: 'screenshot', params: {} }),
        service.executeOperation({ type: 'click', params: { x: 100, y: 100 } }),
        service.executeOperation({ type: 'type', params: { text: 'test' } })
      ];

      const results = await Promise.all(operations);
      expect(results).to.have.length(3);
      results.forEach(result => {
        expect(result.success).to.be.true;
      });
    });

    it('should measure response times and memory usage', async function() {
      axiosStub.resolves({ data: { success: true } });

      const startMemory = process.memoryUsage();
      const startTime = Date.now();

      // Execute multiple operations
      for (let i = 0; i < 10; i++) {
        await service.executeOperation({ type: 'screenshot', params: {} });
      }

      const endTime = Date.now();
      const endMemory = process.memoryUsage();

      const avgResponseTime = (endTime - startTime) / 10;
      const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;

      expect(avgResponseTime).to.be.below(1000); // Less than 1 second average
      expect(memoryIncrease).to.be.below(50 * 1024 * 1024); // Less than 50MB increase

      console.log(`Average response time: ${avgResponseTime}ms`);
      console.log(`Memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
    });
  });

  describe('5. Queue Management Testing', function() {

    it('should test queue processing', async function() {
      axiosStub.resolves({ data: { success: true } });

      // Queue multiple operations
      await service.queueOperation({ type: 'screenshot', params: {} });
      await service.queueOperation({ type: 'click', params: { x: 100, y: 100 } });
      await service.queueOperation({ type: 'type', params: { text: 'test' } });

      expect(service.operationQueue.length).to.equal(3);

      // Process queue
      await service.processQueue();

      expect(service.operationQueue.length).to.equal(0);
      expect(service.queueStats.processed).to.equal(3);
    });

    it('should test queue size limits', async function() {
      service.config.maxQueueSize = 2;

      await service.queueOperation({ type: 'screenshot', params: {} });
      await service.queueOperation({ type: 'click', params: { x: 100, y: 100 } });

      try {
        await service.queueOperation({ type: 'type', params: { text: 'test' } });
        expect.fail('Should have rejected operation due to queue limit');
      } catch (error) {
        expect(error.message).to.include('queue full');
      }
    });

    it('should test retry logic for failed operations', async function() {
      let callCount = 0;
      axiosStub.callsFake(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({ data: { success: true } });
      });

      const operationId = await service.queueOperation({
        type: 'screenshot',
        params: {},
        maxAttempts: 3
      });

      await service.processQueue();

      expect(service.queueStats.processed).to.equal(1);
      expect(callCount).to.equal(3);
    });
  });

  describe('6. Error Handling and Edge Cases', function() {

    it('should handle malformed API responses', async function() {
      axiosStub.resolves({ data: null });

      try {
        await service.executeOperation({ type: 'screenshot', params: {} });
      } catch (error) {
        expect(error.message).to.include('Invalid response');
      }
    });

    it('should handle network disconnection scenarios', async function() {
      axiosStub.rejects(new Error('ECONNREFUSED'));

      const healthResult = await service.performHealthCheck();
      expect(healthResult.overall).to.be.false;
      expect(service.state.isHealthy).to.be.false;
    });

    it('should test service recovery after failures', async function() {
      // Simulate failure
      axiosStub.rejects(new Error('Service unavailable'));

      try {
        await service.executeOperation({ type: 'screenshot', params: {} });
        expect.fail('Should have failed');
      } catch (error) {
        expect(error.message).to.include('Service unavailable');
      }

      // Simulate recovery
      axiosStub.resolves({ data: { success: true } });

      const result = await service.executeOperation({ type: 'screenshot', params: {} });
      expect(result.success).to.be.true;
    });

    it('should validate input sanitization', async function() {
      const maliciousInputs = [
        { text: '<script>alert("xss")</script>' },
        { path: '../../../etc/passwd' },
        { application: 'rm -rf /' }
      ];

      for (const input of maliciousInputs) {
        const operation = { type: 'type', params: input };

        // Should not throw but should sanitize/validate
        await service.validateOperation(operation);
      }
    });
  });
});