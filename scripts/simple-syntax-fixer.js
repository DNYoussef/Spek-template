/**
 * Simple Syntax Fixer - Targeted regex patterns for known issues
 * Safe patterns that won't break valid code
 */

const fs = require('fs');
const path = require('path');

// Safe, targeted patterns
const FIXES = [
  {
    name: 'arrow-function-spacing',
    pattern: /\s*=\s*>\s*/g,
    replacement: ' => ',
    description: 'Fix arrow function spacing (= > → =>)'
  },
  {
    name: 'missing-const-declarations',
    pattern: /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([A-Z][a-zA-Z0-9<>\[\]|,\s]*)\s*=\s*/gm,
    replacement: 'const $1: $2 = ',
    description: 'Add missing const declarations'
  },
  {
    name: 'underscore-property-colon',
    pattern: /(\s+)_([a-zA-Z][a-zA-Z0-9]*)\s*:/g,
    replacement: '$1$2:',
    description: 'Remove underscore prefixes from property names'
  },
  {
    name: 'result-variable-declaration',
    pattern: /^\s*\}\s*catch\s*\([^)]+\)\s*\{\s*_result:\s*([A-Z][a-zA-Z0-9<>]*)\s*=\s*\{/gm,
    replacement: '} catch (error) { const result: $1 = {',
    description: 'Fix catch block result declarations'
  },
  {
    name: 'results-array-declaration',
    pattern: /^\s*results:\s*([A-Z][a-zA-Z0-9<>\[\]]*)\s*=\s*\[\];/gm,
    replacement: 'const results: $1 = [];',
    description: 'Fix results array declarations'
  }
];

function fixFile(filePath) {
  console.log(`Processing: ${path.basename(filePath)}`);

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const appliedFixes = [];

  for (const fix of FIXES) {
    const before = content;
    content = content.replace(fix.pattern, fix.replacement);
    if (content !== before) {
      modified = true;
      appliedFixes.push(fix.name);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✓ Applied: ${appliedFixes.join(', ')}`);
    return { success: true, fixes: appliedFixes.length };
  } else {
    console.log(`  - No changes needed`);
    return { success: true, fixes: 0 };
  }
}

function main() {
  const targetFiles = [
    'src/architecture/langgraph/queen/components/QueenMetricsAggregatorFacade.ts',
    'src/architecture/langgraph/StateGraphFacade.ts',
  ];

  console.log('=== Simple Syntax Fixer ===\n');

  let totalFixes = 0;
  for (const file of targetFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const result = fixFile(fullPath);
      totalFixes += result.fixes;
    } else {
      console.log(`  ✗ File not found: ${file}`);
    }
  }

  console.log(`\nTotal patterns fixed: ${totalFixes}`);
  console.log('Run: npx tsc --noEmit 2>&1 | grep "error TS" | wc -l');
}

main();