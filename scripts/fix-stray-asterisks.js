#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script to fix stray asterisks that cause TypeScript parsing errors
 */

function fixStrayAsterisksInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Remove standalone asterisks on their own lines that are causing syntax errors
    // These are typically at the beginning of lines or after specific constructs
    const problematicPatterns = [
      // Standalone asterisk at beginning of line
      /^\*$/gm,
      // Asterisk after closing brace on its own line
      /^(\s*)\*\s*$/gm,
      // Asterisk after semicolon on its own line
      /;\n\*\n/g,
      // Asterisk after return statement
      /return [^;]+;\n\*\n/g
    ];

    for (const pattern of problematicPatterns) {
      const before = content;
      if (pattern.toString().includes('^(\\s*)\\*\\s*$')) {
        content = content.replace(pattern, '');
      } else if (pattern.toString().includes(';\n\\*\n')) {
        content = content.replace(pattern, (match) => match.replace('*\n', ''));
      } else {
        content = content.replace(pattern, '');
      }

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

function scanForStrayAsterisks(directory) {
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
          if (/^\*$/m.test(content) || /^\s*\*\s*$/m.test(content)) {
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

function main() {
  const projectRoot = process.cwd();
  console.log(`Scanning for files with stray asterisks in: ${projectRoot}`);

  const problematicFiles = scanForStrayAsterisks(projectRoot);

  if (problematicFiles.length === 0) {
    console.log('No files with stray asterisks found.');
    return;
  }

  console.log(`Found ${problematicFiles.length} files with stray asterisks:`);
  problematicFiles.forEach(file => console.log(`  - ${file}`));

  console.log('\nFixing files...');
  let fixedCount = 0;

  for (const file of problematicFiles) {
    if (fixStrayAsterisksInFile(file)) {
      fixedCount++;
    }
  }

  console.log(`\nFixed ${fixedCount} out of ${problematicFiles.length} files.`);
}

if (require.main === module) {
  main();
}

module.exports = { fixStrayAsterisksInFile, scanForStrayAsterisks };