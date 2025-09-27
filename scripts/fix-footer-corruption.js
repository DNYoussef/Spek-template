#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script to fix HTML comment footer corruption in TypeScript files
 * This addresses the critical compilation errors caused by HTML comments in TS files
 */

function findFilesWithCorruptFooters(directory) {
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
          if (content.includes('<!-- AGENT FOOTER BEGIN')) {
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

function fixFooterInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Pattern to match HTML comment footers
    const htmlFooterPattern = /<!-- AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE -->\s*\n([\s\S]*?)\n<!-- AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE -->/;

    const match = content.match(htmlFooterPattern);
    if (match) {
      const footerContent = match[1];

      // Convert to TypeScript block comment
      const tsFooter = `/**
 * AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE
${footerContent.split('\n').map(line => ` * ${line}`).join('\n')}
 * AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE
 */`;

      // Replace the HTML footer with TS footer
      content = content.replace(htmlFooterPattern, tsFooter);

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
  console.log(`Scanning for corrupted TypeScript files in: ${projectRoot}`);

  const corruptedFiles = findFilesWithCorruptFooters(projectRoot);

  if (corruptedFiles.length === 0) {
    console.log('No corrupted files found.');
    return;
  }

  console.log(`Found ${corruptedFiles.length} corrupted files:`);
  corruptedFiles.forEach(file => console.log(`  - ${file}`));

  console.log('\nFixing files...');
  let fixedCount = 0;

  for (const file of corruptedFiles) {
    if (fixFooterInFile(file)) {
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
    console.log('✗ TypeScript compilation still has errors:');
    console.log(error.stdout?.toString() || error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { findFilesWithCorruptFooters, fixFooterInFile };