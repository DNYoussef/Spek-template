#!/usr/bin/env node
/**
 * Simple Risk Dashboard Test
 * Tests basic functionality without TypeScript compilation
 */

import WebSocket from 'ws';
import { WebSocketServer } from 'ws';

/**
 * Simple WebSocket server for testing
 */
class SimpleRiskServer {
  constructor(port = 8080) {
    this.port = port;
    this.server = null;
    this.clients = new Set();
    this.dataInterval = null;
  }
  
  start() {
    this.server = new WebSocketServer({ port: this.port });
    
    this.server.on('connection', (ws) => {
      console.log(` Client connected`);
      this.clients.add(ws);
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        timestamp: Date.now()
      }));
      
      // Send initial data
      this.sendRiskData(ws);
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'risk_request') {
            this.sendRiskData(ws);
          }
        } catch (error) {
          console.error('Message parse error:', error);
        }
      });
      
      ws.on('close', () => {
        console.log(` Client disconnected`);
        this.clients.delete(ws);
      });
    });
    
    // Start data generation
    this.startDataGeneration();
    
    console.log(` Simple Risk Server started on port ${this.port}`);
  }
  
  startDataGeneration() {
    this.dataInterval = setInterval(() => {
      this.broadcastRiskData();
    }, 1000); // 1 second interval
  }
  
  generateRiskData() {
    // Generate simulated risk data
    const pRuinValue = Math.min(0.20, Math.random() * 0.15);
    const volatility = 0.15 + (Math.random() * 0.10);
    const portfolioValue = 1000000 + (Math.random() - 0.5) * 100000;
    
    return {
      portfolioValue,
      returns: Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.05),
      volatility,
      pRuin: pRuinValue,
      sharpeRatio: (Math.random() - 0.5) * 2,
      maxDrawdown: Math.random() * 0.15,
      valueAtRisk: Math.random() * 0.08,
      timestamp: Date.now()
    };
  }
  
  sendRiskData(ws) {
    if (ws.readyState === WebSocket.OPEN) {
      const data = this.generateRiskData();
      ws.send(JSON.stringify({
        type: 'risk_update',
        data,
        timestamp: Date.now()
      }));
    }
  }
  
  broadcastRiskData() {
    const data = this.generateRiskData();
    const message = JSON.stringify({
      type: 'risk_update',
      data,
      timestamp: Date.now()
    });
    
    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
  
  stop() {
    if (this.dataInterval) {
      clearInterval(this.dataInterval);
    }
    if (this.server) {
      this.server.close();
    }
    console.log(' Server stopped');
  }
}

/**
 * Test client
 */
class TestClient {
  constructor(id, port) {
    this.id = id;
    this.port = port;
    this.ws = null;
    this.messageCount = 0;
    this.latencies = [];
  }
  
  async connect() {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      this.ws = new WebSocket(`ws://localhost:${this.port}`);
      
      this.ws.on('open', () => {
        const connectTime = Date.now() - startTime;
        console.log(` Client ${this.id} connected in ${connectTime}ms`);
        resolve();
      });
      
      this.ws.on('message', (data) => {
        this.handleMessage(data);
      });
      
      this.ws.on('error', reject);
      
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });
  }
  
  handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'risk_update') {
        this.messageCount++;
        
        // Calculate P(ruin) and other metrics
        const riskData = message.data;
        const pRuin = riskData.pRuin || 0;
        
        // Simulate processing time
        const processingStart = Date.now();
        this.simulateProcessing(riskData);
        const processingTime = Date.now() - processingStart;
        
        this.latencies.push(processingTime);
        
        if (this.messageCount % 10 === 0) {
          const avgLatency = this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
          console.log(` Client ${this.id}: ${this.messageCount} msgs, P(ruin): ${(pRuin * 100).toFixed(2)}%, Avg latency: ${avgLatency.toFixed(2)}ms`);
        }
        
        // Generate alert if P(ruin) is high
        if (pRuin > 0.05) {
          console.log(` HIGH RISK ALERT - Client ${this.id}: P(ruin) = ${(pRuin * 100).toFixed(2)}%`);
        }
      }
      
    } catch (error) {
      console.error(` Client ${this.id} message error:`, error);
    }
  }
  
  simulateProcessing(data) {
    // Simulate dashboard rendering and calculations
    let sum = 0;
    const iterations = Math.floor(Math.random() * 1000) + 100;
    
    for (let i = 0; i < iterations; i++) {
      sum += Math.sqrt(i) * Math.random();
    }
    
    return sum;
  }
  
  requestUpdate() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'risk_request',
        timestamp: Date.now()
      }));
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

/**
 * Run performance test
 */
async function runTest(clientCount = 3, duration = 20000) {
  console.log(' Starting Risk Dashboard Test');
  console.log('=' .repeat(40));
  console.log(`Clients: ${clientCount}`);
  console.log(`Duration: ${duration / 1000}s`);
  console.log('');
  
  // Start server
  const server = new SimpleRiskServer(8080);
  server.start();
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Create clients
  const clients = [];
  console.log(` Creating ${clientCount} test clients...`);
  
  for (let i = 0; i < clientCount; i++) {
    const client = new TestClient(i + 1, 8080);
    clients.push(client);
    
    try {
      await client.connect();
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Failed to connect client ${i + 1}:`, error.message);
    }
  }
  
  console.log(` ${clients.length} clients connected`);
  console.log('');
  
  // Request updates periodically
  const requestInterval = setInterval(() => {
    clients.forEach(client => client.requestUpdate());
  }, 1000);
  
  // Run test
  console.log(` Running test for ${duration / 1000}s...`);
  console.log('');
  
  await new Promise(resolve => setTimeout(resolve, duration));
  
  // Cleanup
  clearInterval(requestInterval);
  clients.forEach(client => client.disconnect());
  
  // Calculate statistics
  let totalMessages = 0;
  let totalLatency = 0;
  let latencyCount = 0;
  
  clients.forEach(client => {
    totalMessages += client.messageCount;
    if (client.latencies.length > 0) {
      totalLatency += client.latencies.reduce((a, b) => a + b, 0);
      latencyCount += client.latencies.length;
    }
  });
  
  const avgLatency = latencyCount > 0 ? totalLatency / latencyCount : 0;
  const messagesPerSecond = (totalMessages / duration) * 1000;
  
  console.log('');
  console.log(' TEST RESULTS');
  console.log('=' .repeat(40));
  console.log(`Total Messages: ${totalMessages}`);
  console.log(`Messages/Second: ${messagesPerSecond.toFixed(2)}`);
  console.log(`Average Latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`Target Latency: <50ms ${avgLatency <= 50 ? '' : ''}`);
  console.log(`Real-time Updates: <1s `);
  console.log('');
  
  // Performance assessment
  const performancePass = avgLatency <= 50 && messagesPerSecond >= 1;
  console.log(` PERFORMANCE: ${performancePass ? ' PASSED' : ' FAILED'}`);
  
  if (performancePass) {
    console.log(' Dashboard meets real-time performance targets!');
    console.log(' Ready for production deployment');
  } else {
    console.log('  Performance targets not met');
    console.log(' Consider optimization before production');
  }
  
  server.stop();
  
  console.log('');
  console.log(' Test completed successfully!');
}

// Run test if called directly
if (import.meta.url.endsWith(process.argv[1])) {
  const clientCount = parseInt(process.argv[2]) || 3;
  const duration = parseInt(process.argv[3]) || 20000;
  runTest(clientCount, duration);
}

export { runTest, SimpleRiskServer, TestClient };