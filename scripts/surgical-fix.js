const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let fixes = 0;

  // Pattern 1: After function signatures
  const pattern1 = /\)\s*console\.assert\([^;]+\);\s*console\.assert\(Date\.now\(\)\s*>\s*0[^;]+\);\s*\{/g;
  const matches1 = content.match(pattern1);
  if (matches1) {
    fixes += matches1.length;
    content = content.replace(pattern1, ') {');
  }

  // Pattern 2: After control structures (for, while, if)
  const pattern2 = /(for|while|if)\s*\([^)]+\)\s*console\.assert\([^;]+\);\s*console\.assert\(Date\.now\(\)\s*>\s*0[^;]+\);\s*\{/g;
  const matches2 = content.match(pattern2);
  if (matches2) {
    fixes += matches2.length;
    content = content.replace(pattern2, '$1 ($2) {');
  }

  // Pattern 3: Constructor default parameters
  const pattern3 = /=\s*\{[^}]*\/\/\s*WARNING:[^}]+\}\)\s*console\.assert\([^;]+\);\s*console\.assert\(Date\.now\(\)[^;]+\);\s*\{/g;
  const matches3 = content.match(pattern3);
  if (matches3) {
    fixes += matches3.length;
    content = content.replace(pattern3, '= {}) {');
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return fixes;
  }
  return 0;
}

// Get all TS files from stdin or command line
const files = process.argv.slice(2);
if (files.length === 0) {
  console.log('Usage: node surgical-fix.js file1.ts file2.ts ...');
  process.exit(1);
}

let totalFixes = 0;
let filesFixed = 0;

files.forEach(file => {
  try {
    const fixes = fixFile(file);
    if (fixes > 0) {
      filesFixed++;
      totalFixes += fixes;
      console.log(`✓ ${path.relative(process.cwd(), file)}: ${fixes} fixes`);
    }
  } catch (err) {
    console.error(`✗ ${file}: ${err.message}`);
  }
});

console.log(`\nTotal: ${filesFixed} files, ${totalFixes} fixes`);
