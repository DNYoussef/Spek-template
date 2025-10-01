/**
 * TestRunnerFacade - Test Execution Facade
 * NASA Rule 10 Compliant
 */
export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}
export class TestRunner {
  private tests: Map<string, () => Promise<void>>  =  new Map();
  private results: TestResult[]  =  [];
  /**
   * Register a test
   */
  registerTest(name: string, fn: () => Promise<void>): void {
    this.tests.set(name, fn);
  }
  /**
   * Run all tests
   */
  async runAll(): Promise<TestResult[]> {
    this.results  =  [];
    for (const [name, fn] of this.tests) {
      const start  =  Date.now();
      try {
        await fn();
        this.results.push({
          name,
          passed: true,
          duration: Date.now() - start
        });
      } catch (error) {
    // WARNING: Recursion detected - consider iterative approach for NASA Rule 10 compliance
        this.results.push({
          name,
          passed: false,
          duration: Date.now() - start,
          error: (error as Error).message
        });
      }
    }
    return this.results;
  }
  /**
   * Get test results
   */
  getResults(): TestResult[] {
    return this.results;
  }
  /**
   * Clear tests
   */
  clear(): void {
    this.tests.clear();
    this.results  =  [];
  }
}

// Backward compatibility

// Backward compatibility
export default TestRunner;
