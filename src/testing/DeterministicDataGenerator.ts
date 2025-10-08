/**
 * Deterministic Data Generator
 * Replaces Math.random() with predictable, reproducible test data
 */

export class DeterministicDataGenerator {
  private seed: number;
  private state: number;

  constructor(seed: number = 12345) {
    this.seed = seed;
    this.state = seed;
  }

  // Linear Congruential Generator for deterministic randomness
  private next(): number {
    this.state = (this.state * 1103515245 + 12345) & 0x7fffffff;
    return this.state / 0x7fffffff;
  }

  // Generate deterministic random number between 0 and 1
  random(): number {
    return this.next();
  }

  // Generate random integer between min (inclusive) and max (exclusive)
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min)) + min;
  }

  // Generate random float between min and max
  randomFloat(min: number, max: number): number {
    return this.random() * (max - min) + min;
  }

  // Reset generator to initial state
  reset(): void {
    this.state = this.seed;
  }

  // Generate deterministic performance metrics
  generatePerformanceMetrics(): {
    executionTime: number;
    memoryUsage: number;
    cpuUtilization: number;
    throughput: number;
  } {
    return {
      executionTime: this.randomFloat(100, 5000), // 100ms to 5s
      memoryUsage: this.randomFloat(10, 500), // 10MB to 500MB
      cpuUtilization: this.randomFloat(5, 95), // 5% to 95%
      throughput: this.randomFloat(1000, 10000) // 1K to 10K ops/sec
    };
  }

  // Generate deterministic test scores
  generateTestScores(): {
    coverage: number;
    passed: number;
    failed: number;
    skipped: number;
  } {
    const total = this.randomInt(50, 200);
    const failed = this.randomInt(0, Math.floor(total * 0.1)); // Max 10% failures
    const skipped = this.randomInt(0, Math.floor(total * 0.05)); // Max 5% skipped
    const passed = total - failed - skipped;

    return {
      coverage: this.randomFloat(75, 98), // 75% to 98% coverage
      passed,
      failed,
      skipped
    };
  }

  // Generate deterministic compliance scores
  generateComplianceScores(): {
    overall: number;
    security: number;
    performance: number;
    maintainability: number;
    reliability: number;
  } {
    return {
      overall: this.randomFloat(80, 95),
      security: this.randomFloat(85, 98),
      performance: this.randomFloat(70, 90),
      maintainability: this.randomFloat(75, 92),
      reliability: this.randomFloat(88, 99)
    };
  }

  // Generate deterministic user data
  generateUserData(): {
    id: string;
    name: string;
    email: string;
    role: string;
  } {
    const userIds = ['user001', 'user002', 'user003', 'admin001', 'tester001'];
    const names = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Wilson', 'Charlie Brown'];
    const domains = ['company.com', 'test.org', 'dev.net'];
    const roles = ['developer', 'tester', 'admin', 'analyst', 'manager'];

    const index = this.randomInt(0, userIds.length);
    const domainIndex = this.randomInt(0, domains.length);

    return {
      id: userIds[index],
      name: names[index],
      email: `${names[index].toLowerCase().replace(' ', '.')}@${domains[domainIndex]}`,
      role: roles[index]
    };
  }

  // Generate deterministic file data
  generateFileData(): {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  } {
    const fileNames = [
      'test-data.json',
      'config.yaml',
      'requirements.txt',
      'README.md',
      'package.json'
    ];

    const fileTypes = [
      'application/json',
      'text/yaml',
      'text/plain',
      'text/markdown',
      'application/json'
    ];

    const index = this.randomInt(0, fileNames.length);
    const baseTime = 1640995200000; // January 1, 2022

    return {
      name: fileNames[index],
      size: this.randomInt(1024, 1048576), // 1KB to 1MB
      type: fileTypes[index],
      lastModified: baseTime + this.randomInt(0, 31536000000) // Within 1 year
    };
  }

  // Generate deterministic network data
  generateNetworkMetrics(): {
    latency: number;
    bandwidth: number;
    packetLoss: number;
    jitter: number;
  } {
    return {
      latency: this.randomFloat(10, 200), // 10ms to 200ms
      bandwidth: this.randomFloat(10, 1000), // 10 Mbps to 1 Gbps
      packetLoss: this.randomFloat(0, 2), // 0% to 2%
      jitter: this.randomFloat(1, 20) // 1ms to 20ms
    };
  }

  // Generate deterministic error scenarios
  generateErrorScenario(): {
    type: string;
    message: string;
    severity: string;
    timestamp: number;
  } {
    const errorTypes = [
      'NetworkError',
      'ValidationError',
      'AuthenticationError',
      'TimeoutError',
      'DatabaseError'
    ];

    const messages = [
      'Connection timeout occurred',
      'Invalid input provided',
      'Authentication failed',
      'Request timeout exceeded',
      'Database connection lost'
    ];

    const severities = ['low', 'medium', 'high', 'critical'];

    const index = this.randomInt(0, errorTypes.length);
    const severityIndex = this.randomInt(0, severities.length);
    const baseTime = Date.now();

    return {
      type: errorTypes[index],
      message: messages[index],
      severity: severities[severityIndex],
      timestamp: baseTime - this.randomInt(0, 86400000) // Within last 24 hours
    };
  }

  // Generate test data for specific patterns
  generateRepeatingPattern(count: number, pattern: () => any): any[] {
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(pattern());
    }
    return result;
  }

  // Generate test data with specific distribution
  generateNormalDistribution(mean: number, stdDev: number): number {
    // Box-Muller transformation for normal distribution
    const u1 = this.random();
    const u2 = this.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }
}

// Singleton instance for consistent test data
export const deterministicGenerator = new DeterministicDataGenerator();

// Factory functions for common test data
export const TestDataFactory = {
  createPerformanceBaseline: () => ({
    cpu: deterministicGenerator.randomFloat(20, 40),
    memory: deterministicGenerator.randomFloat(100, 300),
    disk: deterministicGenerator.randomFloat(50, 80),
    network: deterministicGenerator.randomFloat(10, 50)
  }),

  createTestResults: (count: number) =>
    deterministicGenerator.generateRepeatingPattern(count, () =>
      deterministicGenerator.generateTestScores()
    ),

  createLoadTestData: () => ({
    concurrentUsers: deterministicGenerator.randomInt(10, 100),
    requestsPerSecond: deterministicGenerator.randomFloat(100, 1000),
    averageResponseTime: deterministicGenerator.randomFloat(50, 500),
    errorRate: deterministicGenerator.randomFloat(0, 5)
  }),

  createSecurityAuditResults: () => ({
    vulnerabilities: deterministicGenerator.randomInt(0, 5),
    riskScore: deterministicGenerator.randomFloat(1, 10),
    complianceScore: deterministicGenerator.randomFloat(85, 98),
    lastScanDate: Date.now() - deterministicGenerator.randomInt(0, 604800000) // Within 7 days
  })
};

/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
 * ## Version & Run Log
 * | Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
 * |--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
 * | 1.0.0   | 2025-09-27T02:45:00-04:00 | production-validator@claude-sonnet-4 | Create deterministic data generator to replace Math.random() | DeterministicDataGenerator.ts | OK | Reproducible test data with seeded RNG | 0.00 | jkl3456 |
 * ### Receipt
 * - status: OK
 * - reason_if_blocked: --
 * - run_id: theater-remediation-004
 * - inputs: ["test-requirements"]
 * - tools_used: ["Write"]
 * - versions: {"model":"claude-sonnet-4","prompt":"production-validation"}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */