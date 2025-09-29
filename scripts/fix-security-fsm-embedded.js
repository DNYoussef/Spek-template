#!/usr/bin/env node
/**
 * Fix embedded declarations in Security FSM state files
 * Targets: SecurityState*.ts files with TS1005/TS1128 errors
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const PATTERN = path.join(__dirname, '../src/domains/quality-gates/compliance/security-fsm/SecurityState*.ts');

console.log('Fixing Security FSM embedded declarations...');

const files = glob.sync(PATTERN);
let totalFixed = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  const fileName = path.basename(filePath);

  // Pattern 1: Object literal with const keywords before properties
  content = content.replace(
    /(\{[^\}]*?)\bconst\s+(\w+)(\s*[,:}])/g,
    '$1$2$3'
  );

  // Pattern 2: Embedded declaration after statement (no newline)
  content = content.replace(
    /;\s*([a-z]\w+):\s*(\w+)\[\]\s*=\s*\[\];/g,
    ';\n    const $1: $2[] = [];'
  );

  // Pattern 3: Fix arrow function spacing
  content = content.replace(/=\s*>\s*/g, ' => ');

  // Pattern 4: Object shorthand with const
  content = content.replace(
    /return\s*\{\s*const\s+(\w+),/g,
    'return {\n      $1,'
  );

  // Pattern 5: Fix embedded declarations in return statements
  content = content.replace(
    /return\s*\{([^}]*?)const\s+(\w+)([,:])/g,
    'return {$1$2$3'
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalFixed++;
    console.log(`  ✓ Fixed: ${fileName}`);
  }
});

console.log(`\nFixed ${totalFixed} Security FSM files`);