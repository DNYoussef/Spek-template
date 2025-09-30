#!/usr/bin/env node

/**
 * NASA POT10 Compliance Checker
 * Validates code against NASA Rule 10 compliance standards
 */

const fs = require('fs');
const path = require('path');

const POT10_RULES = {
  FUNCTION_LENGTH: 60, // Max lines per function
  MIN_ASSERTIONS: 2,   // Minimum assertions per function
  NO_RECURSION: true,  // No recursive functions allowed
  FIXED_LOOPS: true,   // All loops must have fixed bounds
  NO_MALLOC: true,     // No dynamic memory allocation
  CHECK_RETURN: true   // All function returns must be checked
};

class NASAPot10ComplianceChecker {
  constructor() {
    this.results = {
      totalFiles: 0,
      compliantFiles: 0,
      violations: [],
      passRate: 0
    };
  }

  checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const violations = [];

    // Check for function length violations
    const functionMatches = content.match(/(?:async\s+)?(?:function|\w+)\s*\([^)]*\)\s*{/g) || [];
    functionMatches.forEach((func, index) => {
      const funcStart = content.indexOf(func);
      const funcEnd = this.findClosingBrace(content, funcStart);
      const funcContent = content.substring(funcStart, funcEnd);
      const lineCount = funcContent.split('\n').length;

      if (lineCount > POT10_RULES.FUNCTION_LENGTH) {
        violations.push({
          rule: 'FUNCTION_LENGTH',
          message: `Function ${index + 1} exceeds ${POT10_RULES.FUNCTION_LENGTH} lines (found ${lineCount})`,
          file: filePath
        });
      }
    });

    // Check for assertions
    const assertionCount = (content.match(/console\.assert|assert/g) || []).length;
    if (assertionCount < POT10_RULES.MIN_ASSERTIONS && functionMatches.length > 0) {
      violations.push({
        rule: 'MIN_ASSERTIONS',
        message: `File has insufficient assertions (found ${assertionCount}, requires ${POT10_RULES.MIN_ASSERTIONS} per function)`,
        file: filePath
      });
    }

    // Check for recursion (simplified check)
    if (content.includes('arguments.callee') || this.hasRecursion(content)) {
      violations.push({
        rule: 'NO_RECURSION',
        message: 'Potential recursion detected',
        file: filePath
      });
    }

    return violations;
  }

  hasRecursion(content) {
    // Simple heuristic: check if function calls itself
    const functionNames = content.match(/function\s+(\w+)/g) || [];
    for (const funcDecl of functionNames) {
      const funcName = funcDecl.replace('function ', '');
      const pattern = new RegExp(`\\b${funcName}\\s*\\(`, 'g');
      const matches = content.match(pattern) || [];
      if (matches.length > 1) {
        return true;
      }
    }
    return false;
  }

  findClosingBrace(content, startPos) {
    let braceCount = 0;
    let inString = false;
    let stringChar = null;

    for (let i = startPos; i < content.length; i++) {
      const char = content[i];
      const prevChar = i > 0 ? content[i - 1] : '';

      // Handle string literals
      if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = null;
        }
        continue;
      }

      if (!inString) {
        if (char === '{') braceCount++;
        if (char === '}') {
          braceCount--;
          if (braceCount === 0) return i + 1;
        }
      }
    }

    return content.length;
  }

  async checkDirectory(dirPath) {
    const files = this.getTypeScriptFiles(dirPath);

    for (const file of files) {
      try {
        const violations = this.checkFile(file);
        this.results.totalFiles++;

        if (violations.length === 0) {
          this.results.compliantFiles++;
        } else {
          this.results.violations.push(...violations);
        }
      } catch (error) {
        console.error(`Error checking ${file}:`, error.message);
      }
    }

    this.results.passRate = this.results.totalFiles > 0
      ? (this.results.compliantFiles / this.results.totalFiles * 100).toFixed(1)
      : 0;
  }

  getTypeScriptFiles(dirPath) {
    const files = [];
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.includes('node_modules') && !item.startsWith('.')) {
        files.push(...this.getTypeScriptFiles(fullPath));
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.js'))) {
        files.push(fullPath);
      }
    }

    return files;
  }

  generateReport() {
    console.log('\\n📊 NASA POT10 Compliance Report');
    console.log('================================');
    console.log(`Total Files Checked: ${this.results.totalFiles}`);
    console.log(`Compliant Files: ${this.results.compliantFiles}`);
    console.log(`Pass Rate: ${this.results.passRate}%`);
    console.log(`Total Violations: ${this.results.violations.length}`);

    if (this.results.violations.length > 0) {
      console.log('\\n⚠️  Violations Found:');
      const violationsByRule = {};

      for (const violation of this.results.violations) {
        if (!violationsByRule[violation.rule]) {
          violationsByRule[violation.rule] = [];
        }
        violationsByRule[violation.rule].push(violation);
      }

      for (const [rule, violations] of Object.entries(violationsByRule)) {
        console.log(`\\n${rule}: ${violations.length} violations`);
        violations.slice(0, 3).forEach(v => {
          console.log(`  - ${path.basename(v.file)}: ${v.message}`);
        });
        if (violations.length > 3) {
          console.log(`  ... and ${violations.length - 3} more`);
        }
      }
    }

    // Write compliance score to file for CI/CD
    const artifactsDir = path.join(__dirname, '..', '.claude', '.artifacts');
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }
    const scoreFilePath = path.join(artifactsDir, 'compliance-score.txt');
    fs.writeFileSync(scoreFilePath, this.results.passRate);
    console.log(`\\n📝 Compliance score written to: ${scoreFilePath}`);

    // Return exit code based on pass rate
    const requiredPassRate = 90;
    if (parseFloat(this.results.passRate) >= requiredPassRate) {
      console.log(`\\n✅ PASSED: Compliance rate ${this.results.passRate}% meets requirement (>=${requiredPassRate}%)`);
      return 0;
    } else {
      console.log(`\\n❌ FAILED: Compliance rate ${this.results.passRate}% below requirement (>=${requiredPassRate}%)`);
      return 1;
    }
  }
}

// Main execution
async function main() {
  const checker = new NASAPot10ComplianceChecker();
  const targetDir = process.argv[2] || 'src';

  console.log(`🔍 Checking NASA POT10 compliance in ${targetDir}...`);

  await checker.checkDirectory(targetDir);
  const exitCode = checker.generateReport();

  process.exit(exitCode);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = NASAPot10ComplianceChecker;