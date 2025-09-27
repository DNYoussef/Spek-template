/**
 * Test Coverage Analyzer
 * Comprehensive test coverage analysis and improvement recommendations
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname, relative, dirname, basename } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CoverageAnalysisResult {
  overallCoverage: number;
  targetCoverage: number;
  coverageByType: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  filesCoverage: FileCoverage[];
  uncoveredFiles: string[];
  testGaps: TestGap[];
  recommendations: string[];
  improvementPlan: ImprovementAction[];
}

export interface FileCoverage {
  file: string;
  statements: { covered: number; total: number; percentage: number };
  branches: { covered: number; total: number; percentage: number };
  functions: { covered: number; total: number; percentage: number };
  lines: { covered: number; total: number; percentage: number };
  uncoveredLines: number[];
  complexity: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface TestGap {
  file: string;
  type: 'MISSING_TEST' | 'INSUFFICIENT_COVERAGE' | 'MISSING_EDGE_CASES' | 'NO_ERROR_TESTING';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  suggestedTests: string[];
}

export interface ImprovementAction {
  priority: number;
  action: string;
  description: string;
  estimatedImpact: number; // Coverage points gained
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  files: string[];
}

export class TestCoverageAnalyzer {
  private projectRoot: string;
  private sourceFiles: string[] = [];
  private testFiles: string[] = [];
  private targetCoverage = 95;

  constructor(projectRoot: string, targetCoverage = 95) {
    this.projectRoot = projectRoot;
    this.targetCoverage = targetCoverage;
    this.sourceFiles = this.findSourceFiles();
    this.testFiles = this.findTestFiles();
  }

  async analyzeCoverage(): Promise<CoverageAnalysisResult> {
    const coverageData = await this.gatherCoverageData();
    const filesCoverage = await this.analyzeFileCoverage(coverageData);
    const uncoveredFiles = this.findUncoveredFiles();
    const testGaps = await this.identifyTestGaps();
    const recommendations = this.generateRecommendations(filesCoverage, testGaps);
    const improvementPlan = this.createImprovementPlan(filesCoverage, testGaps);

    const overallCoverage = this.calculateOverallCoverage(filesCoverage);
    const coverageByType = this.calculateCoverageByType(filesCoverage);

    return {
      overallCoverage,
      targetCoverage: this.targetCoverage,
      coverageByType,
      filesCoverage,
      uncoveredFiles,
      testGaps,
      recommendations,
      improvementPlan
    };
  }

  private async gatherCoverageData(): Promise<any> {
    try {
      // Try to run coverage analysis
      const { stdout } = await execAsync('npm run test:coverage -- --reporter=json', 
        { cwd: this.projectRoot });
      return JSON.parse(stdout);
    } catch (error) {
      console.warn('Coverage data not available, using static analysis');
      return this.performStaticAnalysis();
    }
  }

  private async performStaticAnalysis(): Promise<any> {
    // Fallback static analysis when coverage tools aren't available
    const analysis: any = {
      coverageMap: {},
      total: {
        statements: { covered: 0, total: 0, percentage: 0 },
        branches: { covered: 0, total: 0, percentage: 0 },
        functions: { covered: 0, total: 0, percentage: 0 },
        lines: { covered: 0, total: 0, percentage: 0 }
      }
    };

    // Estimate coverage based on test file presence
    for (const sourceFile of this.sourceFiles) {
      const hasTest = this.hasCorrespondingTest(sourceFile);
      const estimatedCoverage = hasTest ? 70 : 0; // Conservative estimate
      
      const fileAnalysis = await this.analyzeFileStatically(sourceFile);
      analysis.coverageMap[sourceFile] = {
        statements: { 
          covered: Math.round(fileAnalysis.statements * estimatedCoverage / 100),
          total: fileAnalysis.statements,
          percentage: estimatedCoverage
        },
        branches: {
          covered: Math.round(fileAnalysis.branches * estimatedCoverage / 100),
          total: fileAnalysis.branches,
          percentage: estimatedCoverage
        },
        functions: {
          covered: Math.round(fileAnalysis.functions * estimatedCoverage / 100),
          total: fileAnalysis.functions,
          percentage: estimatedCoverage
        },
        lines: {
          covered: Math.round(fileAnalysis.lines * estimatedCoverage / 100),
          total: fileAnalysis.lines,
          percentage: estimatedCoverage
        },
        uncoveredLines: hasTest ? [] : Array.from({ length: fileAnalysis.lines }, (_, i) => i + 1)
      };
    }

    return analysis;
  }

  private async analyzeFileStatically(file: string): Promise<{
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  }> {
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    const statements = (content.match(/;/g) || []).length;
    const branches = (
      (content.match(/\bif\b/g) || []).length +
      (content.match(/\belse\b/g) || []).length +
      (content.match(/\bswitch\b/g) || []).length +
      (content.match(/\bcase\b/g) || []).length +
      (content.match(/\?/g) || []).length
    );
    const functions = (
      (content.match(/function\s+\w+/g) || []).length +
      (content.match(/\w+\s*=\s*\(/g) || []).length +
      (content.match(/\w+\s*=\s*async/g) || []).length
    );

    return {
      statements,
      branches,
      functions,
      lines: lines.length
    };
  }

  private async analyzeFileCoverage(coverageData: any): Promise<FileCoverage[]> {
    const filesCoverage: FileCoverage[] = [];

    for (const sourceFile of this.sourceFiles) {
      const fileCoverage = coverageData.coverageMap?.[sourceFile];
      
      if (fileCoverage) {
        const complexity = await this.calculateComplexity(sourceFile);
        const priority = this.determinePriority(fileCoverage, complexity);

        filesCoverage.push({
          file: sourceFile,
          statements: fileCoverage.statements,
          branches: fileCoverage.branches,
          functions: fileCoverage.functions,
          lines: fileCoverage.lines,
          uncoveredLines: fileCoverage.uncoveredLines || [],
          complexity,
          priority
        });
      }
    }

    return filesCoverage.sort((a, b) => {
      const priorityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private findUncoveredFiles(): string[] {
    return this.sourceFiles.filter(file => !this.hasCorrespondingTest(file));
  }

  private hasCorrespondingTest(sourceFile: string): boolean {
    const relativePath = relative(join(this.projectRoot, 'src'), sourceFile);
    const baseName = basename(relativePath, extname(relativePath));
    const dirName = dirname(relativePath);

    const possibleTestPaths = [
      join(this.projectRoot, 'tests', dirName, `${baseName}.test.ts`),
      join(this.projectRoot, 'tests', dirName, `${baseName}.test.js`),
      join(this.projectRoot, 'src', dirName, `${baseName}.test.ts`),
      join(this.projectRoot, 'src', dirName, `${baseName}.test.js`),
      join(this.projectRoot, 'tests', `${baseName}.test.ts`),
      join(this.projectRoot, 'tests', `${baseName}.test.js`)
    ];

    return possibleTestPaths.some(path => existsSync(path));
  }

  private async identifyTestGaps(): Promise<TestGap[]> {
    const gaps: TestGap[] = [];

    // Find files without tests
    for (const file of this.uncoveredFiles) {
      gaps.push({
        file,
        type: 'MISSING_TEST',
        description: 'No test file found for this source file',
        severity: 'HIGH',
        suggestedTests: this.generateSuggestedTests(file)
      });
    }

    // Analyze existing tests for gaps
    for (const testFile of this.testFiles) {
      const testGaps = await this.analyzeTestFile(testFile);
      gaps.push(...testGaps);
    }

    return gaps;
  }

  private generateSuggestedTests(file: string): string[] {
    const content = readFileSync(file, 'utf8');
    const suggestions: string[] = [];

    // Analyze file content to suggest tests
    const functions = content.match(/(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=)/g);
    if (functions) {
      functions.forEach(func => {
        const name = func.match(/\w+/)?.[0];
        if (name) {
          suggestions.push(`Test ${name} with valid inputs`);
          suggestions.push(`Test ${name} with invalid inputs`);
          suggestions.push(`Test ${name} error handling`);
        }
      });
    }

    // Check for classes
    const classes = content.match(/class\s+(\w+)/g);
    if (classes) {
      classes.forEach(cls => {
        const name = cls.match(/\w+$/)?.[0];
        if (name) {
          suggestions.push(`Test ${name} constructor`);
          suggestions.push(`Test ${name} public methods`);
          suggestions.push(`Test ${name} edge cases`);
        }
      });
    }

    // Check for async functions
    if (content.includes('async')) {
      suggestions.push('Test async operations');
      suggestions.push('Test async error handling');
      suggestions.push('Test timeout scenarios');
    }

    // Check for error handling
    if (content.includes('throw') || content.includes('Error')) {
      suggestions.push('Test error conditions');
      suggestions.push('Test error message accuracy');
    }

    return suggestions.slice(0, 10); // Limit suggestions
  }

  private async analyzeTestFile(testFile: string): Promise<TestGap[]> {
    const gaps: TestGap[] = [];
    const content = readFileSync(testFile, 'utf8');

    // Check for missing error testing
    if (!content.includes('throw') && !content.includes('Error') && !content.includes('reject')) {
      gaps.push({
        file: testFile,
        type: 'NO_ERROR_TESTING',
        description: 'Test file lacks error condition testing',
        severity: 'MEDIUM',
        suggestedTests: ['Add error handling tests', 'Test invalid input scenarios']
      });
    }

    // Check for edge case testing
    const testCount = (content.match(/\bit\s*\(/g) || []).length;
    if (testCount < 3) {
      gaps.push({
        file: testFile,
        type: 'INSUFFICIENT_COVERAGE',
        description: 'Low number of test cases',
        severity: 'MEDIUM',
        suggestedTests: ['Add more test cases', 'Test edge cases', 'Test boundary conditions']
      });
    }

    return gaps;
  }

  private generateRecommendations(filesCoverage: FileCoverage[], testGaps: TestGap[]): string[] {
    const recommendations: string[] = [];

    // Overall coverage recommendations
    const avgCoverage = this.calculateOverallCoverage(filesCoverage);
    if (avgCoverage < this.targetCoverage) {
      const gap = this.targetCoverage - avgCoverage;
      recommendations.push(`PRIORITY: Increase coverage by ${gap.toFixed(1)}% to reach ${this.targetCoverage}% target`);
    }

    // Critical files recommendations
    const criticalFiles = filesCoverage.filter(f => f.priority === 'CRITICAL');
    if (criticalFiles.length > 0) {
      recommendations.push(`CRITICAL: Address ${criticalFiles.length} high-priority files with low coverage`);
    }

    // Missing tests recommendations
    const missingTests = testGaps.filter(g => g.type === 'MISSING_TEST');
    if (missingTests.length > 0) {
      recommendations.push(`HIGH: Create tests for ${missingTests.length} uncovered files`);
    }

    // Error testing recommendations
    const noErrorTests = testGaps.filter(g => g.type === 'NO_ERROR_TESTING');
    if (noErrorTests.length > 0) {
      recommendations.push(`MEDIUM: Add error testing to ${noErrorTests.length} test files`);
    }

    // Coverage by type recommendations
    const coverageByType = this.calculateCoverageByType(filesCoverage);
    if (coverageByType.branches < 80) {
      recommendations.push('MEDIUM: Improve branch coverage - add conditional testing');
    }
    if (coverageByType.functions < 90) {
      recommendations.push('MEDIUM: Improve function coverage - test all exported functions');
    }

    return recommendations;
  }

  private createImprovementPlan(filesCoverage: FileCoverage[], testGaps: TestGap[]): ImprovementAction[] {
    const actions: ImprovementAction[] = [];

    // Action 1: Address critical coverage gaps
    const criticalFiles = filesCoverage.filter(f => f.priority === 'CRITICAL');
    if (criticalFiles.length > 0) {
      actions.push({
        priority: 1,
        action: 'Address Critical Coverage Gaps',
        description: 'Focus on files with high complexity and low coverage',
        estimatedImpact: criticalFiles.length * 15,
        effort: 'HIGH',
        files: criticalFiles.map(f => f.file)
      });
    }

    // Action 2: Create missing tests
    const missingTestFiles = testGaps
      .filter(g => g.type === 'MISSING_TEST')
      .map(g => g.file);
    if (missingTestFiles.length > 0) {
      actions.push({
        priority: 2,
        action: 'Create Missing Test Files',
        description: 'Create test files for uncovered source files',
        estimatedImpact: missingTestFiles.length * 20,
        effort: 'MEDIUM',
        files: missingTestFiles
      });
    }

    // Action 3: Improve existing tests
    const improvableFiles = filesCoverage.filter(f => 
      f.priority === 'HIGH' && f.statements.percentage < 80
    );
    if (improvableFiles.length > 0) {
      actions.push({
        priority: 3,
        action: 'Enhance Existing Tests',
        description: 'Add test cases to improve coverage of existing tests',
        estimatedImpact: improvableFiles.length * 10,
        effort: 'MEDIUM',
        files: improvableFiles.map(f => f.file)
      });
    }

    // Action 4: Add error testing
    const errorTestingFiles = testGaps
      .filter(g => g.type === 'NO_ERROR_TESTING')
      .map(g => g.file);
    if (errorTestingFiles.length > 0) {
      actions.push({
        priority: 4,
        action: 'Add Error Testing',
        description: 'Add error condition and edge case testing',
        estimatedImpact: errorTestingFiles.length * 5,
        effort: 'LOW',
        files: errorTestingFiles
      });
    }

    return actions.sort((a, b) => a.priority - b.priority);
  }

  private calculateOverallCoverage(filesCoverage: FileCoverage[]): number {
    if (filesCoverage.length === 0) return 0;
    
    let totalStatements = 0;
    let coveredStatements = 0;

    for (const file of filesCoverage) {
      totalStatements += file.statements.total;
      coveredStatements += file.statements.covered;
    }

    return totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0;
  }

  private calculateCoverageByType(filesCoverage: FileCoverage[]) {
    if (filesCoverage.length === 0) {
      return { statements: 0, branches: 0, functions: 0, lines: 0 };
    }

    const totals = {
      statements: { covered: 0, total: 0 },
      branches: { covered: 0, total: 0 },
      functions: { covered: 0, total: 0 },
      lines: { covered: 0, total: 0 }
    };

    for (const file of filesCoverage) {
      totals.statements.covered += file.statements.covered;
      totals.statements.total += file.statements.total;
      totals.branches.covered += file.branches.covered;
      totals.branches.total += file.branches.total;
      totals.functions.covered += file.functions.covered;
      totals.functions.total += file.functions.total;
      totals.lines.covered += file.lines.covered;
      totals.lines.total += file.lines.total;
    }

    return {
      statements: totals.statements.total > 0 ? (totals.statements.covered / totals.statements.total) * 100 : 0,
      branches: totals.branches.total > 0 ? (totals.branches.covered / totals.branches.total) * 100 : 0,
      functions: totals.functions.total > 0 ? (totals.functions.covered / totals.functions.total) * 100 : 0,
      lines: totals.lines.total > 0 ? (totals.lines.covered / totals.lines.total) * 100 : 0
    };
  }

  private async calculateComplexity(file: string): Promise<number> {
    const content = readFileSync(file, 'utf8');
    
    // Simple cyclomatic complexity calculation
    const complexityIndicators = [
      'if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||', '?'
    ];
    
    let complexity = 1; // Base complexity
    for (const indicator of complexityIndicators) {
      const matches = content.match(new RegExp(`\\b${indicator}\\b`, 'g'));
      if (matches) {
        complexity += matches.length;
      }
    }
    
    return complexity;
  }

  private determinePriority(
    coverage: any, 
    complexity: number
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const avgCoverage = (
      coverage.statements.percentage +
      coverage.branches.percentage +
      coverage.functions.percentage
    ) / 3;

    if (avgCoverage < 50 && complexity > 10) return 'CRITICAL';
    if (avgCoverage < 70 && complexity > 7) return 'HIGH';
    if (avgCoverage < 80 || complexity > 5) return 'MEDIUM';
    return 'LOW';
  }

  private findSourceFiles(): string[] {
    const files: string[] = [];
    const srcDir = join(this.projectRoot, 'src');
    
    const walkDir = (dir: string) => {
      try {
        const items = readdirSync(dir);
        for (const item of items) {
          const fullPath = join(dir, item);
          const stat = statSync(fullPath);
          
          if (stat.isDirectory()) {
            walkDir(fullPath);
          } else if (['.ts', '.js', '.tsx', '.jsx'].includes(extname(item)) &&
                     !item.includes('.test.') && !item.includes('.spec.')) {
            files.push(fullPath);
          }
        }
      } catch {
        // Directory doesn't exist
      }
    };
    
    walkDir(srcDir);
    return files;
  }

  private findTestFiles(): string[] {
    const files: string[] = [];
    const testDirs = [
      join(this.projectRoot, 'tests'),
      join(this.projectRoot, 'test'),
      join(this.projectRoot, 'src')
    ];
    
    const walkDir = (dir: string) => {
      try {
        const items = readdirSync(dir);
        for (const item of items) {
          const fullPath = join(dir, item);
          const stat = statSync(fullPath);
          
          if (stat.isDirectory()) {
            walkDir(fullPath);
          } else if (['.ts', '.js'].includes(extname(item)) &&
                     (item.includes('.test.') || item.includes('.spec.'))) {
            files.push(fullPath);
          }
        }
      } catch {
        // Directory doesn't exist
      }
    };
    
    for (const testDir of testDirs) {
      walkDir(testDir);
    }
    
    return files;
  }
}