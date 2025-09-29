#!/usr/bin/env node
/**
 * Fix Type Augmentation Files - Wave 3.3
 * Targets: property-augmentations.ts, fsm-types.ts, test-types.ts
 *
 * Pattern fixes:
 * 1. Arrow function spacing: `= >` → `=>`
 * 2. Export type declarations: `export const type` → `export type`
 * 3. Enum const keyword: `const IDLE` inside enum → `IDLE`
 * 4. Malformed assertions in global block
 */

const fs = require('fs');
const path = require('path');

const FILES = [
  'src/types/property-augmentations.ts',
  'src/types/fsm-types.ts',
  'src/types/test-types.ts'
];

const FIXES = [
  {
    name: 'arrow-function-spacing',
    pattern: /\s*=\s*>\s*/g,
    replacement: ' => ',
    description: 'Fix arrow function spacing (= > → =>)'
  },
  {
    name: 'export-type-declarations',
    pattern: /export\s+const\s+type\s+/g,
    replacement: 'export type ',
    description: 'Fix export type declarations (export const type → export type)'
  },
  {
    name: 'enum-const-keyword',
    pattern: /(export\s+enum\s+\w+\s*\{[^}]*?)\bconst\s+(\w+\s*=)/g,
    replacement: '$1$2',
    description: 'Remove const keyword from enum members'
  },
  {
    name: 'global-assertions',
    pattern: /^(declare\s+global)\s+console\.assert\([^)]+\);\s*console\.assert\([^)]+\);\s*\{/gm,
    replacement: '$1 {',
    description: 'Remove malformed assertions from global declaration'
  }
];

function applyFixes(content) {
  let modified = content;
  const applied = [];

  FIXES.forEach(fix => {
    const before = modified;
    modified = modified.replace(fix.pattern, fix.replacement);
    if (before !== modified) {
      applied.push(fix.name);
    }
  });

  return { content: modified, applied };
}

function main() {
  console.log('=== Type File Fixer - Wave 3.3 ===\n');

  let totalFiles = 0;
  let totalFixes = 0;

  FILES.forEach(file => {
    const fullPath = path.join(process.cwd(), file);

    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  SKIP: ${file} (not found)`);
      return;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const { content: fixed, applied } = applyFixes(content);

    if (applied.length === 0) {
      console.log(`✓ OK: ${file} (no fixes needed)`);
      return;
    }

    fs.writeFileSync(fullPath, fixed, 'utf8');
    totalFiles++;
    totalFixes += applied.length;

    console.log(`✓ FIXED: ${file}`);
    console.log(`  Applied: ${applied.join(', ')}\n`);
  });

  console.log(`\n=== Summary ===`);
  console.log(`Files modified: ${totalFiles}`);
  console.log(`Total fixes applied: ${totalFixes}`);
}

main();