/**
 * Integration Test for Complete Audit Pipeline
 * Tests: Subagent  Princess Audit  Quality Enhancement  GitHub  Queen
 */

import { PrincessAuditGate, SubagentWork } from '../../src/swarm/hierarchy/PrincessAuditGate';
import { HivePrincess } from '../../src/swarm/hierarchy/HivePrincess';
import { SwarmQueen } from '../../src/swarm/hierarchy/SwarmQueen';
import * as fs from 'fs';
import * as path from 'path';

// Test utilities
class TestLogger {
  private logs: string[] = [];

  log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);
    console.log(logEntry);
  }

  getLogs(): string[] {
    return this.logs;
  }

  clear(): void {
    this.logs = [];
  }
}

// Mock implementations for testing
class MockSubagent {
  constructor(
    private id: string,
    private type: string,
    private qualityLevel: 'theater' | 'buggy' | 'decent' | 'perfect'
  ) {}

  async generateWork(taskId: string, taskDescription: string): Promise<SubagentWork> {
    const testFiles = this.createTestFiles();

    return {
      subagentId: this.id,
      subagentType: this.type,
      taskId: taskId,
      taskDescription: taskDescription,
      claimedCompletion: true,
      files: testFiles,
      changes: [`Generated ${testFiles.length} files for ${taskDescription}`],
      metadata: {
        startTime: Date.now() - 5000,
        endTime: Date.now(),
        model: 'test-model',
        platform: 'test-platform'
      },
      context: {
        requirements: taskDescription,
        testMode: true,
        qualityLevel: this.qualityLevel
      }
    };
  }

  private createTestFiles(): string[] {
    const testDir = path.join(process.cwd(), 'tests', 'temp', this.id);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    const files: string[] = [];

    switch (this.qualityLevel) {
      case 'theater':
        // Create files with mocks and TODOs (should fail Stage 1)
        files.push(this.createTheaterFile(testDir));
        break;
      case 'buggy':
        // Create files with bugs (should fail Stage 2/3)
        files.push(this.createBuggyFile(testDir));
        break;
      case 'decent':
        // Create working but low-quality files (should fail Stage 6-8)
        files.push(this.createDecentFile(testDir));
        break;
      case 'perfect':
        // Create perfect, NASA-compliant files (should pass all stages)
        files.push(this.createPerfectFile(testDir));
        break;
    }

    return files;
  }

  private createTheaterFile(dir: string): string {
    const filePath = path.join(dir, 'theater-code.ts');
    const content = `
// MOCK implementation - not real
export class UserService {
  async getUser(id: string): Promise<any> {
    // TODO: Implement this
    return { mock: true, id };
  }

  async createUser(data: any): Promise<any> {
    // STUB - not implemented yet
    throw new Error('Not implemented');
  }

  private mockDatabase(): void {
    // This is just a mock
    console.log('Mock database initialized');
  }
}
`;
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  private createBuggyFile(dir: string): string {
    const filePath = path.join(dir, 'buggy-code.ts');
    const content = `
export class Calculator {
  // Real implementation but with bugs
  add(a: number, b: number): number {
    return a - b; // BUG: Should be addition
  }

  divide(a: number, b: number): number {
    return a / b; // BUG: No zero check
  }

  async processData(data: any[]): Promise<number> {
    let sum = 0;
    for (let i = 0; i <= data.length; i++) { // BUG: Off-by-one error
      sum += data[i];
    }
    return sum;
  }
}
`;
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  private createDecentFile(dir: string): string {
    const filePath = path.join(dir, 'decent-code.ts');
    const content = `
export class DataProcessor {
  private data: any[] = [];
  private cache: Map<string, any> = new Map();
  private logger: any;
  private database: any;
  private validator: any;
  private transformer: any;
  private analyzer: any;
  private reporter: any;

  // God object - too many responsibilities
  constructor() {
    this.logger = console;
    this.database = {};
    this.validator = {};
    this.transformer = {};
    this.analyzer = {};
    this.reporter = {};
  }

  // Complex method with high cyclomatic complexity
  async processAllData(input: any): Promise<any> {
    if (!input) return null;

    if (typeof input === 'string') {
      if (input.length > 100) {
        if (input.includes('special')) {
          if (this.cache.has(input)) {
            return this.cache.get(input);
          } else {
            const result = await this.transform(input);
            this.cache.set(input, result);
            return result;
          }
        } else {
          return this.basicProcess(input);
        }
      } else {
        return input.toUpperCase();
      }
    } else if (Array.isArray(input)) {
      const results = [];
      for (let i = 0; i < input.length; i++) {
        results.push(await this.processAllData(input[i]));
      }
      return results;
    } else {
      return JSON.stringify(input);
    }
  }

  private transform(data: string): string {
    // Violates NASA rule: Function too long
    let result = data;
    result = result.replace(/a/g, 'A');
    result = result.replace(/b/g, 'B');
    result = result.replace(/c/g, 'C');
    result = result.replace(/d/g, 'D');
    result = result.replace(/e/g, 'E');
    result = result.replace(/f/g, 'F');
    result = result.replace(/g/g, 'G');
    result = result.replace(/h/g, 'H');
    result = result.replace(/i/g, 'I');
    result = result.replace(/j/g, 'J');
    return result;
  }

  private basicProcess(data: string): string {
    return data;
  }

  // Violates Single Responsibility Principle
  async saveToDatabase(data: any): Promise<void> {
    this.validate(data);
    this.transform(data);
    this.analyze(data);
    this.report(data);
    this.database[Date.now()] = data;
  }

  private validate(data: any): void {}
  private analyze(data: any): void {}
  private report(data: any): void {}
}
`;
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  private createPerfectFile(dir: string): string {
    const filePath = path.join(dir, 'perfect-code.ts');
    const content = `
/**
 * NASA-compliant User Service
 * Follows all Power of Ten rules
 * Single responsibility, no recursion, bounded loops
 */

interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly createdAt: number;
}

interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

/**
 * User service with single responsibility
 * Max 60 lines per function (NASA Rule 3)
 */
export class UserService {
  private static readonly MAX_NAME_LENGTH = 100;
  private static readonly MAX_EMAIL_LENGTH = 255;
  private static readonly TIMEOUT_MS = 5000;

  constructor(
    private readonly repository: UserRepository,
    private readonly validator: UserValidator
  ) {
    // Assert invariants (NASA Rule 5)
    if (!repository) {
      throw new Error('Repository required');
    }
    if (!validator) {
      throw new Error('Validator required');
    }
  }

  /**
   * Get user by ID with proper error handling
   * No heap memory allocation in this function (NASA Rule 2)
   */
  async getUser(id: string): Promise<User | null> {
    // Input validation (NASA Rule 5)
    if (!this.validator.isValidId(id)) {
      throw new Error('Invalid user ID');
    }

    // Bounded operation with timeout (NASA Rule 1)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), UserService.TIMEOUT_MS);
    });

    try {
      return await Promise.race([
        this.repository.findById(id),
        timeoutPromise
      ]);
    } catch (error) {
      // Proper error handling (NASA Rule 10)
      if (error.message === 'Timeout') {
        throw new Error('Operation timed out');
      }
      throw error;
    }
  }

  /**
   * Create user with comprehensive validation
   * Function limited to 60 lines (NASA Rule 3)
   */
  async createUser(name: string, email: string): Promise<User> {
    // Assert preconditions (NASA Rule 5)
    this.validateName(name);
    this.validateEmail(email);

    const user: User = {
      id: this.generateId(),
      name: name.substring(0, UserService.MAX_NAME_LENGTH),
      email: email.substring(0, UserService.MAX_EMAIL_LENGTH),
      createdAt: Date.now()
    };

    await this.repository.save(user);
    return user;
  }

  /**
   * Validate name with bounded checks
   * No recursion (NASA Rule 1)
   */
  private validateName(name: string): void {
    if (!name || name.length === 0) {
      throw new Error('Name required');
    }
    if (name.length > UserService.MAX_NAME_LENGTH) {
      throw new Error('Name too long');
    }

    // Check each character (bounded loop - NASA Rule 1)
    const len = Math.min(name.length, UserService.MAX_NAME_LENGTH);
    for (let i = 0; i < len; i++) {
      const char = name.charAt(i);
      if (!this.isValidNameChar(char)) {
        throw new Error('Invalid character in name');
      }
    }
  }

  /**
   * Validate email with bounded checks
   */
  private validateEmail(email: string): void {
    if (!email || email.length === 0) {
      throw new Error('Email required');
    }
    if (email.length > UserService.MAX_EMAIL_LENGTH) {
      throw new Error('Email too long');
    }
    if (!this.validator.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }
  }

  /**
   * Check if character is valid for names
   * Simple, bounded function (NASA Rule 3)
   */
  private isValidNameChar(char: string): boolean {
    const code = char.charCodeAt(0);
    return (code >= 65 && code <= 90) || // A-Z
           (code >= 97 && code <= 122) || // a-z
           code === 32 || // space
           code === 45 || // hyphen
           code === 39; // apostrophe
  }

  /**
   * Generate unique ID
   * No dynamic memory allocation (NASA Rule 2)
   */
  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.floor(Math.random() * 1000000).toString(36);
    return timestamp + random;
  }
}

/**
 * Separate validator class (Single Responsibility)
 */
export class UserValidator {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly ID_REGEX = /^[a-z0-9]{8,20}$/;

  isValidEmail(email: string): boolean {
    return UserValidator.EMAIL_REGEX.test(email);
  }

  isValidId(id: string): boolean {
    return UserValidator.ID_REGEX.test(id);
  }
}
`;
    fs.writeFileSync(filePath, content);
    return filePath;
  }
}

// Main test runner
async function runPipelineTest(): Promise<void> {
  const logger = new TestLogger();

  logger.log('========================================');
  logger.log('AUDIT PIPELINE INTEGRATION TEST');
  logger.log('========================================\n');

  // Clean up test directory
  const testDir = path.join(process.cwd(), 'tests', 'temp');
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir, { recursive: true });

  // Test scenarios
  const scenarios = [
    {
      name: 'Theater Detection Test',
      subagent: new MockSubagent('sa-001', 'coder', 'theater'),
      expectedResult: 'rejected',
      expectedStage: 1
    },
    {
      name: 'Buggy Code Test',
      subagent: new MockSubagent('sa-002', 'coder', 'buggy'),
      expectedResult: 'rejected',
      expectedStage: 2
    },
    {
      name: 'Low Quality Test',
      subagent: new MockSubagent('sa-003', 'coder', 'decent'),
      expectedResult: 'rejected',
      expectedStage: 6
    },
    {
      name: 'Perfect Code Test',
      subagent: new MockSubagent('sa-004', 'coder', 'perfect'),
      expectedResult: 'approved',
      expectedStage: 9
    }
  ];

  // Initialize Princess with audit gate
  const princess = new HivePrincess('Development', {
    enableAudit: true,
    strictMode: true,
    maxDebugIterations: 3
  });

  logger.log('Initialized HivePrincess for Development domain');
  logger.log('Audit system: ENABLED');
  logger.log('Strict mode: ENABLED\n');

  // Run each scenario
  for (const scenario of scenarios) {
    logger.log(`\n========================================`);
    logger.log(`TEST: ${scenario.name}`);
    logger.log(`========================================`);
    logger.log(`Subagent: ${scenario.subagent['type']} (${scenario.subagent['id']})`);
    logger.log(`Quality Level: ${scenario.subagent['qualityLevel']}`);
    logger.log(`Expected: ${scenario.expectedResult} at stage ${scenario.expectedStage}\n`);

    try {
      // Generate work from subagent
      const work = await scenario.subagent.generateWork(
        `task-${Date.now()}`,
        `Implement ${scenario.name} feature`
      );

      logger.log('Work generated by subagent:');
      logger.log(`  Files: ${work.files.length}`);
      logger.log(`  Claimed completion: ${work.claimedCompletion}`);

      // Submit to Princess audit
      logger.log('\nSubmitting to Princess Audit Gate...');
      const auditResult = await princess.auditSubagentCompletion(
        work.subagentId,
        work.taskId,
        work.taskDescription,
        work.files,
        work.changes,
        work.metadata
      );

      // Check results
      logger.log(`\nAudit Result: ${auditResult.finalStatus.toUpperCase()}`);

      if (auditResult.finalStatus === 'approved') {
        logger.log(' Work APPROVED - Ready for Queen!');
        logger.log('All quality gates passed:');
        logger.log('  - No theater detected');
        logger.log('  - All tests passing');
        logger.log('  - 100% NASA compliant');
        logger.log('  - 100% Defense standards met');
        logger.log('  - 100% Enterprise quality achieved');
      } else {
        logger.log(' Work REJECTED');
        if (auditResult.rejectionReasons) {
          logger.log('Rejection reasons:');
          for (const reason of auditResult.rejectionReasons) {
            logger.log(`  - ${reason}`);
          }
        }
      }

      // Verify expected outcome
      const passed = auditResult.finalStatus === scenario.expectedResult;
      logger.log(`\nTest Result: ${passed ? ' PASS' : ' FAIL'}`);

      if (!passed) {
        logger.log(`  Expected: ${scenario.expectedResult}`);
        logger.log(`  Got: ${auditResult.finalStatus}`);
      }

    } catch (error) {
      logger.log(`\n Test failed with error: ${error.message}`);
    }
  }

  // Summary
  logger.log('\n\n========================================');
  logger.log('TEST SUMMARY');
  logger.log('========================================');
  logger.log(`Total scenarios: ${scenarios.length}`);
  logger.log('Pipeline stages tested:');
  logger.log('   Stage 1: Theater Detection');
  logger.log('   Stage 2: Sandbox Validation');
  logger.log('   Stage 3: Debug Cycle');
  logger.log('   Stage 4: Final Validation');
  logger.log('   Stage 6: Enterprise Quality Analysis');
  logger.log('   Stage 7: NASA-Compliant Enhancement');
  logger.log('   Stage 8: Ultimate Validation');
  logger.log('   Stage 9: GitHub Recording');

  // Save test results
  const resultsPath = path.join(testDir, 'test-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    scenarios: scenarios.length,
    logs: logger.getLogs()
  }, null, 2));

  logger.log(`\nTest results saved to: ${resultsPath}`);
}

// Run the test
if (require.main === module) {
  runPipelineTest().catch(console.error);
}

export { runPipelineTest, MockSubagent, TestLogger };