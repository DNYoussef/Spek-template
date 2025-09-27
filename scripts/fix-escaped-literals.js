#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script to fix malformed string literals with escaped newlines
 * This addresses critical compilation errors caused by literal \n instead of actual newlines
 */

function findFilesWithEscapedLiterals(directory) {
  const files = [];

  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('\\n  ') || content.includes('\\n}') || content.includes('\\nexport')) {
            files.push(fullPath);
          }
        } catch (error) {
          console.warn(`Warning: Could not read ${fullPath}: ${error.message}`);
        }
      }
    }
  }

  scan(directory);
  return files;
}

function fixEscapedLiteralsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Track if any changes were made
    let changed = false;

    // Fix escaped newlines in various contexts
    const fixes = [
      // Interface/type definitions with escaped newlines
      { from: /\\n  /g, to: '\n  ' },
      { from: /\\n}/g, to: '\n}' },
      { from: /\\nexport/g, to: '\nexport' },
      { from: /\\ninterface/g, to: '\ninterface' },
      { from: /\\ntype/g, to: '\ntype' },
      { from: /\\nclass/g, to: '\nclass' },
      { from: /\\nconst/g, to: '\nconst' },
      { from: /\\nlet/g, to: '\nlet' },
      { from: /\\nvar/g, to: '\nvar' },
      { from: /\\nfunction/g, to: '\nfunction' },
      { from: /\\nimport/g, to: '\nimport' },
      { from: /\\n\/\//g, to: '\n//' },
      { from: /\\n\/\\*/g, to: '\n/*' },
      { from: /\\n\\*/g, to: '\n*' },
      // Long lines with escaped content
      { from: /\{\\n/g, to: '{\n' },
      { from: /;\\n/g, to: ';\n' },
      { from: /\\n\\}/g, to: '\n}' },
    ];

    for (const fix of fixes) {
      const before = content;
      content = content.replace(fix.from, fix.to);
      if (content !== before) {
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}: ${error.message}`);
    return false;
  }
}

function main() {
  const projectRoot = process.cwd();
  console.log(`Scanning for files with escaped literals in: ${projectRoot}`);

  const corruptedFiles = findFilesWithEscapedLiterals(projectRoot);

  if (corruptedFiles.length === 0) {
    console.log('No files with escaped literals found.');
    return;
  }

  console.log(`Found ${corruptedFiles.length} files with escaped literals:`);
  corruptedFiles.forEach(file => console.log(`  - ${file}`));

  console.log('\nFixing files...');
  let fixedCount = 0;

  for (const file of corruptedFiles) {
    if (fixEscapedLiteralsInFile(file)) {
      fixedCount++;
    }
  }

  console.log(`\nFixed ${fixedCount} out of ${corruptedFiles.length} files.`);

  // Verify TypeScript compilation
  console.log('\nVerifying TypeScript compilation...');
  try {
    execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
    console.log('✓ TypeScript compilation successful!');
  } catch (error) {
    console.log('✗ TypeScript compilation still has errors (may need manual fixes):');
    const output = error.stdout?.toString() || error.message;
    const lines = output.split('\n').slice(0, 20); // Show first 20 errors
    lines.forEach(line => console.log(line));
    if (output.split('\n').length > 20) {
      console.log('... (truncated, more errors exist)');
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { findFilesWithEscapedLiterals, fixEscapedLiteralsInFile };