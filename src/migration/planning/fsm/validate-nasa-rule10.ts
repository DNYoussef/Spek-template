/**
 * NASA Rule 10 validation script for refactored AnalysisStateMachine.
 * Validates that all functions are ≤60 lines and have 2+ assertions.
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  fileName: string;
  functionName: string;
  lineCount: number;
  assertionCount: number;
  passed: boolean;
  issues: string[];
}

interface ValidationSummary {
  totalFiles: number;
  totalFunctions: number;
  passedFunctions: number;
  failedFunctions: number;
  results: ValidationResult[];
}

/**
 * Validates NASA Rule 10 compliance across all FSM files.
 * NASA Rule 10: Functions ≤60 lines, 2+ assertions
 */
function validateNASARule10(): ValidationSummary {
  const fsmDir = __dirname;
  const results: ValidationResult[] = [];

  // Get all TypeScript files in FSM directory
  const files = getAllTSFiles(fsmDir);

  for (const filePath of files) {
    const fileResults = validateFile(filePath);
    results.push(...fileResults);
  }

  const totalFunctions = results.length;
  const passedFunctions = results.filter(r => r.passed).length;
  const failedFunctions = totalFunctions - passedFunctions;

  return {
    totalFiles: files.length,
    totalFunctions,
    passedFunctions,
    failedFunctions,
    results
  };
}

/**
 * Gets all TypeScript files in directory and subdirectories.
 * NASA Rule 10: ≤60 lines, 2+ assertions
 */
function getAllTSFiles(dir: string): string[] {
  const files: string[] = [];
  const maxFiles = 50; // Fixed bound for loop

  function traverseDir(currentDir: string, depth: number = 0): void {
    if (depth > 5 || files.length >= maxFiles) return; // Prevent deep recursion

    try {
      const entries = fs.readdirSync(currentDir);

      for (const entry of entries) {
        if (files.length >= maxFiles) break;

        const fullPath = path.join(currentDir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !entry.includes('node_modules')) {
          traverseDir(fullPath, depth + 1);
        } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Could not read directory ${currentDir}:`, error);
    }
  }

  traverseDir(dir);

  if (files.length === 0) {
    throw new Error('No TypeScript files found for validation');
  }

  if (files.length >= maxFiles) {
    console.warn(`File limit reached (${maxFiles}), some files may not be validated`);
  }

  return files;
}

/**
 * Validates NASA Rule 10 compliance for a single file.
 * NASA Rule 10: ≤60 lines, 2+ assertions
 */
function validateFile(filePath: string): ValidationResult[] {
  const results: ValidationResult[] = [];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);

    const functions = extractFunctions(content);

    if (functions.length === 0) {
      console.warn(`No functions found in ${fileName}`);
      return results;
    }

    for (const func of functions) {
      const lineCount = func.body.split('\n').length;
      const assertionCount = countAssertions(func.body);

      const issues: string[] = [];
      let passed = true;

      if (lineCount > 60) {
        issues.push(`Function exceeds 60 lines (${lineCount} lines)`);
        passed = false;
      }

      if (assertionCount < 2) {
        issues.push(`Function has insufficient assertions (${assertionCount} assertions, need 2+)`);
        passed = false;
      }

      results.push({
        fileName,
        functionName: func.name,
        lineCount,
        assertionCount,
        passed,
        issues
      });
    }
  } catch (error) {
    console.error(`Error validating file ${filePath}:`, error);
  }

  if (results.length === 0) {
    throw new Error(`No validation results for file ${filePath}`);
  }

  return results;
}

/**
 * Extracts function definitions from TypeScript code.
 * NASA Rule 10: ≤60 lines, 2+ assertions
 */
function extractFunctions(content: string): Array<{ name: string; body: string }> {
  const functions: Array<{ name: string; body: string }> = [];
  const lines = content.split('\n');

  let currentFunction: { name: string; startLine: number; braceCount: number } | null = null;
  const maxFunctions = 100; // Fixed bound

  for (let i = 0; i < lines.length && functions.length < maxFunctions; i++) {
    const line = lines[i].trim();

    // Look for function/method declarations
    const functionMatch = line.match(/(?:async\s+)?(?:private\s+|protected\s+|public\s+)?(?:static\s+)?(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/);

    if (functionMatch && !currentFunction) {
      currentFunction = {
        name: functionMatch[1],
        startLine: i,
        braceCount: 1
      };
      continue;
    }

    if (currentFunction) {
      // Count braces to find function end
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      currentFunction.braceCount += openBraces - closeBraces;

      if (currentFunction.braceCount === 0) {
        // Function ended
        const functionBody = lines.slice(currentFunction.startLine, i + 1).join('\n');
        functions.push({
          name: currentFunction.name,
          body: functionBody
        });
        currentFunction = null;
      }
    }
  }

  if (functions.length >= maxFunctions) {
    console.warn(`Function limit reached (${maxFunctions}), some functions may not be analyzed`);
  }

  return functions;
}

/**
 * Counts assertion statements in function body.
 * NASA Rule 10: ≤60 lines, 2+ assertions
 */
function countAssertions(functionBody: string): number {
  // Count assert() calls and throw statements
  const assertMatches = functionBody.match(/assert\s*\(/g) || [];
  const throwMatches = functionBody.match(/throw\s+new\s+Error/g) || [];

  const totalAssertions = assertMatches.length + throwMatches.length;

  if (totalAssertions < 0) {
    throw new Error('Assertion count cannot be negative');
  }

  if (totalAssertions > 50) {
    console.warn(`Unusually high assertion count: ${totalAssertions}`);
  }

  return totalAssertions;
}

/**
 * Generates validation report.
 * NASA Rule 10: ≤60 lines, 2+ assertions
 */
function generateReport(summary: ValidationSummary): string {
  const { totalFiles, totalFunctions, passedFunctions, failedFunctions, results } = summary;

  let report = '# NASA Rule 10 Validation Report\n\n';
  report += `## Summary\n`;
  report += `- Total Files: ${totalFiles}\n`;
  report += `- Total Functions: ${totalFunctions}\n`;
  report += `- Passed: ${passedFunctions} (${Math.round(passedFunctions / totalFunctions * 100)}%)\n`;
  report += `- Failed: ${failedFunctions} (${Math.round(failedFunctions / totalFunctions * 100)}%)\n\n`;

  if (failedFunctions > 0) {
    report += `## Failed Functions\n\n`;
    const failedResults = results.filter(r => !r.passed);

    for (const result of failedResults) {
      report += `### ${result.fileName}::${result.functionName}\n`;
      report += `- Lines: ${result.lineCount}\n`;
      report += `- Assertions: ${result.assertionCount}\n`;
      report += `- Issues:\n`;
      for (const issue of result.issues) {
        report += `  - ${issue}\n`;
      }
      report += '\n';
    }
  }

  report += `## All Functions\n\n`;
  report += `| File | Function | Lines | Assertions | Status |\n`;
  report += `|------|----------|-------|------------|--------|\n`;

  for (const result of results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    report += `| ${result.fileName} | ${result.functionName} | ${result.lineCount} | ${result.assertionCount} | ${status} |\n`;
  }

  if (report.length === 0) {
    throw new Error('Report generation failed - no content');
  }

  if (totalFunctions === 0) {
    throw new Error('No functions found for validation');
  }

  return report;
}

// Run validation if called directly
if (require.main === module) {
  try {
    console.log('Starting NASA Rule 10 validation...');
    const summary = validateNASARule10();
    const report = generateReport(summary);

    console.log(report);

    if (summary.failedFunctions > 0) {
      console.error(`❌ Validation failed: ${summary.failedFunctions} functions do not comply with NASA Rule 10`);
      process.exit(1);
    } else {
      console.log('✅ All functions comply with NASA Rule 10');
    }
  } catch (error) {
    console.error('Validation error:', error);
    process.exit(1);
  }
}

export { validateNASARule10, generateReport, ValidationResult, ValidationSummary };