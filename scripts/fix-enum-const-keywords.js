#!/usr/bin/env node
/**
 * Fix 'const' keywords in enum members across all TypeScript files
 * TS1357 error: An enum member name must be followed by a ',', '=', or '}'
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const FILES_PATTERN = path.join(__dirname, '../src/**/*.ts');

console.log('Fixing enum const keywords...');

const files = glob.sync(FILES_PATTERN);
let totalFixed = 0;
let filesFixed = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Pattern: enum member with 'const' keyword
  // Matches: const MEMBER = 'value' or const MEMBER = "value"
  content = content.replace(
    /(export\s+enum\s+\w+\s*\{[^}]*?)const\s+(\w+\s*=)/g,
    '$1$2'
  );

  // More aggressive: any 'const' followed by uppercase identifier inside enum
  const enumBlocks = [];
  const enumRegex = /export\s+enum\s+\w+\s*\{[^}]*\}/gs;
  let match;

  while ((match = enumRegex.exec(content)) !== null) {
    enumBlocks.push({
      original: match[0],
      start: match.index,
      end: match.index + match[0].length
    });
  }

  // Process enum blocks
  enumBlocks.reverse().forEach(block => {
    let enumContent = block.original;
    let fixed = enumContent;

    // Remove 'const' before enum members
    fixed = fixed.replace(/\n\s*const\s+([A-Z_][A-Z_0-9]*\s*=)/g, '\n  $1');
    fixed = fixed.replace(/\{\s*const\s+([A-Z_][A-Z_0-9]*\s*=)/g, '{\n  $1');

    if (fixed !== enumContent) {
      content = content.substring(0, block.start) + fixed + content.substring(block.end);
      totalFixed++;
    }
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesFixed++;
  }
});

console.log(`✓ Fixed ${totalFixed} enum const keywords in ${filesFixed} files`);

if (filesFixed > 0) {
  console.log('  Modified files:');
  files.forEach(filePath => {
    const relPath = path.relative(path.join(__dirname, '..'), filePath);
    if (fs.readFileSync(filePath, 'utf8') !== fs.readFileSync(filePath, 'utf8')) {
      console.log(`    - ${relPath}`);
    }
  });
}