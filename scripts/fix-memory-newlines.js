#!/usr/bin/env node

/**
 * Fix Escaped Newlines in Memory System Files
 * Converts \\n sequences to actual newlines
 */

const fs = require('fs');
const path = require('path');

const memoryFiles = [
  'src/memory/coordination/CrossPrincessMemoryCoordinator.ts'
];

function fixNewlines(content) {
  // Convert escaped newlines to actual newlines
  let fixed = content
    // Fix escaped newlines with proper formatting
    .replace(/\\n/g, '\n')
    // Clean up multiple consecutive newlines
    .replace(/\n\n\n+/g, '\n\n')
    // Fix spacing around braces
    .replace(/}\s*\n\s*\n\s*/g, '}\n\n')
    .replace(/{\s*\n\s*\n\s*/g, '{\n')
    // Fix method spacing
    .replace(/\n\s*\/\*\*\n/g, '\n\n  /**\n')
    .replace(/\n\s*async\s+/g, '\n\n  async ')
    .replace(/\n\s*private\s+/g, '\n\n  private ')
    // Clean up extra spaces
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s*\n\s*\n/g, '\n\n');

  return fixed;
}

function fixFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const fixed = fixNewlines(content);

    if (content !== fixed) {
      fs.writeFileSync(fullPath, fixed, 'utf8');
      console.log(`Fixed newlines in: ${filePath}`);
      return true;
    } else {
      console.log(`No newline issues found in: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('Fixing escaped newlines in memory system files...');

  let fixedCount = 0;
  for (const file of memoryFiles) {
    if (fixFile(file)) {
      fixedCount++;
    }
  }

  console.log(`\nNewline fixing completed. ${fixedCount} files were modified.`);

  // Verify TypeScript compilation
  console.log('\nVerifying TypeScript compilation...');
  const { exec } = require('child_process');
  exec('npx tsc --noEmit src/memory/coordination/CrossPrincessMemoryCoordinator.ts', (error, stdout, stderr) => {
    if (error) {
      console.log('TypeScript errors still present:');
      console.log(stderr.split('\n').slice(0, 10).join('\n'));
    } else {
      console.log('TypeScript compilation successful!');
    }
  });
}

if (require.main === module) {
  main();
}

module.exports = { fixNewlines, fixFile };