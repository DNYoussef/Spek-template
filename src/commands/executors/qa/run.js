/**
 * QA Run Command Executor
 * Runs comprehensive quality assurance suite
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class QARunExecutor {
  async execute(args, context) {
    const {
      target = '.',
      tests = true,
      lint = true,
      types = true,
      coverage = true
    } = args;

    console.log('[QA] Starting comprehensive QA suite...');

    const results = {
      tests: null,
      lint: null,
      types: null,
      coverage: null,
      summary: {
        passed: 0,
        failed: 0,
        skipped: 0
      }
    };

    // Run tests
    if (tests) {
      console.log('[QA] Running tests...');
      results.tests = await this.runTests(target);
      if (results.tests.success) results.summary.passed++;
      else results.summary.failed++;
    }

    // Run linting
    if (lint) {
      console.log('[QA] Running linter...');
      results.lint = await this.runLint(target);
      if (results.lint.success) results.summary.passed++;
      else results.summary.failed++;
    }

    // Run type checking
    if (types) {
      console.log('[QA] Running type checker...');
      results.types = await this.runTypeCheck(target);
      if (results.types.success) results.summary.passed++;
      else results.summary.failed++;
    }

    // Run coverage analysis
    if (coverage) {
      console.log('[QA] Running coverage analysis...');
      results.coverage = await this.runCoverage(target);
      if (results.coverage.success) results.summary.passed++;
      else results.summary.failed++;
    }

    // Generate overall status
    results.success = results.summary.failed === 0;
    results.timestamp = new Date().toISOString();

    return results;
  }

  async runTests(target) {
    try {
      const result = await this.runCommand('npm', ['test'], target);
      return {
        success: result.code === 0,
        output: result.stdout,
        errors: result.stderr
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async runLint(target) {
    try {
      // Check if eslint config exists
      const hasEslint = await this.fileExists(path.join(target, '.eslintrc.js')) ||
                       await this.fileExists(path.join(target, '.eslintrc.json'));

      if (!hasEslint) {
        return {
          success: true,
          skipped: true,
          message: 'No ESLint configuration found'
        };
      }

      const result = await this.runCommand('npm', ['run', 'lint'], target);
      return {
        success: result.code === 0,
        output: result.stdout,
        errors: result.stderr
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async runTypeCheck(target) {
    try {
      // Check if TypeScript is configured
      const hasTsConfig = await this.fileExists(path.join(target, 'tsconfig.json'));

      if (!hasTsConfig) {
        return {
          success: true,
          skipped: true,
          message: 'No TypeScript configuration found'
        };
      }

      const result = await this.runCommand('npm', ['run', 'typecheck'], target);
      return {
        success: result.code === 0,
        output: result.stdout,
        errors: result.stderr
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async runCoverage(target) {
    try {
      const result = await this.runCommand('npm', ['run', 'test:coverage'], target);

      // Parse coverage summary if available
      const coverageMatch = result.stdout.match(/All files\s+\|\s+([\d.]+)/);
      const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : null;

      return {
        success: result.code === 0,
        coverage,
        output: result.stdout,
        errors: result.stderr
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async runCommand(command, args, cwd) {
    return new Promise((resolve) => {
      const child = spawn(command, args, {
        cwd,
        shell: true,
        windowsHide: true
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });

      child.on('error', (error) => {
        resolve({
          code: 1,
          stdout,
          stderr: error.message
        });
      });
    });
  }

  async fileExists(filepath) {
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = new QARunExecutor();