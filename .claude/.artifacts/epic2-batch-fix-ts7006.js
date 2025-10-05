#!/usr/bin/env node
/**
 * Epic 2: Automated TS7006 Implicit Any Parameter Fixes
 *
 * Handles common patterns:
 * 1. Error handlers: (error) => ... → (error: unknown) => ...
 * 2. Reduce callbacks: (sum, score) => ... → (sum: number, score: number) => ...
 * 3. Generic data: (data) => ... → (data: unknown) => ...
 * 4. Short vars in filters/maps: (c) => ... → needs context analysis
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Common type patterns
const TYPE_PATTERNS = {
  error: 'unknown',
  e: 'unknown',
  err: 'unknown',
  data: 'unknown',
  result: 'unknown',
  sum: 'number',
  score: 'number',
  value: 'unknown',
  item: 'unknown',
  opt: 'unknown',
  change: 'unknown',
  event: 'unknown',
  metrics: 'unknown',
  measurement: 'unknown',
  violation: 'unknown'
};

// Get all TS7006 errors
function getTS7006Errors() {
  try {
    const output = execSync('npx tsc --noEmit 2>&1', { encoding: 'utf8' });
    const errors = output.split('\n').filter(line => line.includes('TS7006'));
    return errors.map(parseError).filter(Boolean);
  } catch (error) {
    // tsc returns non-zero on errors, but we still get output
    const output = error.stdout || '';
    const errors = output.split('\n').filter(line => line.includes('TS7006'));
    return errors.map(parseError).filter(Boolean);
  }
}

// Parse error line
function parseError(line) {
  // Format: src/file.ts(123,45): error TS7006: Parameter 'varName' implicitly has an 'any' type.
  const match = line.match(/^(.+\.ts)\((\d+),(\d+)\):.+Parameter '([^']+)'/);
  if (!match) return null;

  return {
    file: match[1],
    line: parseInt(match[2]),
    col: parseInt(match[3]),
    param: match[4]
  };
}

// Read file lines
function readFileLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n');
  } catch {
    return null;
  }
}

// Write file lines
function writeFileLines(filePath, lines) {
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
}

// Fix parameter in line
function fixParameterInLine(line, param, lineNum, colNum) {
  // Determine type for parameter
  const inferredType = TYPE_PATTERNS[param] || 'unknown';

  // Pattern 1: Arrow function parameter (param) =>
  let fixed = line.replace(
    new RegExp(`\\(${param}\\)\\s*=>`, 'g'),
    `(${param}: ${inferredType}) =>`
  );

  // Pattern 2: Arrow function with multiple params (param, other) =>
  if (fixed === line) {
    fixed = line.replace(
      new RegExp(`([,(])\\s*${param}\\s*([,)])`, 'g'),
      `$1${param}: ${inferredType}$2`
    );
  }

  // Pattern 3: Function parameter (less common in errors)
  if (fixed === line) {
    fixed = line.replace(
      new RegExp(`function\\s*\\([^)]*${param}[^)]*\\)`, 'g'),
      (match) => match.replace(param, `${param}: ${inferredType}`)
    );
  }

  return fixed !== line ? fixed : null;
}

// Process file
function processFile(filePath, errorsInFile) {
  const lines = readFileLines(filePath);
  if (!lines) {
    console.log(`  ⚠️  Cannot read file: ${filePath}`);
    return 0;
  }

  let fixCount = 0;
  const processedLines = new Set();

  // Sort errors by line number (descending) to avoid line number shifts
  const sortedErrors = [...errorsInFile].sort((a, b) => b.line - a.line);

  for (const error of sortedErrors) {
    const lineIdx = error.line - 1;
    if (processedLines.has(lineIdx)) continue;

    const original = lines[lineIdx];
    const fixed = fixParameterInLine(original, error.param, error.line, error.col);

    if (fixed) {
      lines[lineIdx] = fixed;
      processedLines.add(lineIdx);
      fixCount++;
      console.log(`    Line ${error.line}: ${error.param} → ${TYPE_PATTERNS[error.param] || 'unknown'}`);
    }
  }

  if (fixCount > 0) {
    writeFileLines(filePath, lines);
  }

  return fixCount;
}

// Main execution
async function main() {
  console.log('=== Epic 2: TS7006 Batch Fix ===\n');

  console.log('Scanning for TS7006 errors...');
  const errors = getTS7006Errors();
  console.log(`Found ${errors.length} TS7006 errors\n`);

  if (errors.length === 0) {
    console.log('✅ No TS7006 errors found!');
    return;
  }

  // Group errors by file
  const errorsByFile = errors.reduce((acc, error) => {
    if (!acc[error.file]) acc[error.file] = [];
    acc[error.file].push(error);
    return acc;
  }, {});

  console.log(`Processing ${Object.keys(errorsByFile).length} files...\n`);

  let totalFixed = 0;
  for (const [filePath, fileErrors] of Object.entries(errorsByFile)) {
    console.log(`📝 ${filePath} (${fileErrors.length} errors)`);
    const fixed = processFile(filePath, fileErrors);
    totalFixed += fixed;
    console.log(`  ✓ Fixed: ${fixed}/${fileErrors.length}\n`);
  }

  // Re-scan to check remaining
  console.log('\n=== Validation ===');
  const remaining = getTS7006Errors();
  console.log(`Errors fixed: ${errors.length - remaining.length}`);
  console.log(`Errors remaining: ${remaining.length}`);
  console.log(`Fix rate: ${((errors.length - remaining.length) / errors.length * 100).toFixed(1)}%`);

  if (remaining.length > 0) {
    console.log(`\n⚠️  ${remaining.length} errors require manual review:`);
    remaining.slice(0, 10).forEach(e => {
      console.log(`  - ${e.file}:${e.line} - Parameter '${e.param}'`);
    });
  }

  return { fixed: errors.length - remaining.length, remaining: remaining.length };
}

main().then(({ fixed, remaining }) => {
  console.log(`\n✅ Batch fix complete: ${fixed} errors fixed, ${remaining} remaining`);
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
