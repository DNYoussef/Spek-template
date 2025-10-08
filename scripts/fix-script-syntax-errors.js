/**
 * Automated Script Syntax Error Fixer
 * Fixes the 25 scripts with syntax errors identified in inventory
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('AUTOMATED SCRIPT SYNTAX ERROR FIXER');
console.log('='.repeat(80));
console.log();

const scriptsDir = path.join(__dirname);
let fixCount = 0;
let skipCount = 0;
const fixes = [];

// Load error list from inventory
const inventoryPath = path.join(__dirname, '../.claude/.artifacts/scripts-inventory-report.json');
let errorScripts = [];

try {
  const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
  errorScripts = inventory.inventory.filter(item => item.status === 'invalid');
  console.log(`Found ${errorScripts.length} scripts with syntax errors\n`);
} catch (error) {
  console.log('Error loading inventory, will skip automated fixes');
  process.exit(1);
}

// Fix 1: Unterminated triple-quoted strings (Python)
const fixUnterminatedTripleQuotes = (content, filename) => {
  // Count triple quotes
  const tripleDoubleQuotes = (content.match(/"""/g) || []).length;
  const tripleSingleQuotes = (content.match(/'''/g) || []).length;

  let fixed = false;
  let fixType = '';

  // If odd number of triple double quotes, add one at end
  if (tripleDoubleQuotes % 2 !== 0) {
    content += '\n"""\n';
    fixed = true;
    fixType = 'Added closing triple double quotes';
  }

  // If odd number of triple single quotes, add one at end
  if (tripleSingleQuotes % 2 !== 0) {
    content += "\n'''\n";
    fixed = true;
    fixType = 'Added closing triple single quotes';
  }

  return { content, fixed, fixType };
};

// Fix 2: Markdown footer in code files
const fixMarkdownFooter = (content, filename) => {
  const ext = path.extname(filename);
  let fixed = false;
  let fixType = '';

  // Check if file contains markdown footer markers
  if (content.includes('<!-- AGENT FOOTER BEGIN') || content.includes('## Version & Run Log')) {
    const lines = content.split('\n');
    const newLines = [];
    let inFooter = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect footer start
      if (line.includes('<!-- AGENT FOOTER BEGIN') || line.includes('## Version & Run Log')) {
        inFooter = true;
        if (ext === '.py') {
          newLines.push('"""');
        } else if (ext === '.sh') {
          newLines.push(': <<\'FOOTER\'');
        } else if (ext === '.js') {
          newLines.push('/*');
        }
      }

      // Add line (comment it if in footer)
      if (inFooter) {
        newLines.push(line);
      } else {
        newLines.push(line);
      }

      // Detect footer end
      if (line.includes('<!-- AGENT FOOTER END')) {
        if (ext === '.py') {
          newLines.push('"""');
        } else if (ext === '.sh') {
          newLines.push('FOOTER');
        } else if (ext === '.js') {
          newLines.push('*/');
        }
        inFooter = false;
        fixed = true;
        fixType = 'Wrapped markdown footer in comments';
      }
    }

    content = newLines.join('\n');
  }

  return { content, fixed, fixType };
};

// Fix 3: Leading zeros in decimal literals (Python)
const fixLeadingZeros = (content, filename) => {
  if (path.extname(filename) !== '.py') {
    return { content, fixed: false, fixType: '' };
  }

  // Match patterns like "2025-09-29" in table format
  const regex = /\|\s*(\d{1,2})\.(\d+)\s*\|\s*20\d{2}-0[1-9]-\d{2}/g;
  const matches = content.match(regex);

  if (matches) {
    // This is likely a markdown table in Python, wrap in triple quotes
    const lines = content.split('\n');
    const newLines = [];
    let inTable = false;

    for (const line of lines) {
      if (line.includes('|') && line.includes('20') && line.match(/\d{2}-0[1-9]-\d{2}/)) {
        if (!inTable) {
          newLines.push('"""');
          inTable = true;
        }
        newLines.push(line);
      } else if (inTable && !line.trim().startsWith('|')) {
        newLines.push('"""');
        newLines.push(line);
        inTable = false;
      } else {
        newLines.push(line);
      }
    }

    if (inTable) {
      newLines.push('"""');
    }

    return {
      content: newLines.join('\n'),
      fixed: true,
      fixType: 'Wrapped table with leading zeros in triple quotes'
    };
  }

  return { content, fixed: false, fixType: '' };
};

// Fix 4: Missing docstrings (Python)
const fixMissingDocstrings = (content, filename) => {
  if (path.extname(filename) !== '.py') {
    return { content, fixed: false, fixType: '' };
  }

  // Check if file starts with description but no docstring
  const lines = content.split('\n');
  if (lines.length > 5) {
    const firstLine = lines[0].trim();
    const secondLine = lines[1].trim();

    // If first line is comment and second line looks like description
    if (firstLine.startsWith('#') && secondLine.length > 10 && !secondLine.startsWith('#')) {
      // Add docstring quotes
      lines[0] = `"""${firstLine.replace(/^#+\s*/, '')}`;
      lines[1] = secondLine;
      lines.splice(2, 0, '"""');
      return {
        content: lines.join('\n'),
        fixed: true,
        fixType: 'Added missing docstring from comment'
      };
    }
  }

  return { content, fixed: false, fixType: '' };
};

// Process each error script
errorScripts.forEach((script, index) => {
  console.log(`[${index + 1}/${errorScripts.length}] Fixing ${script.name}...`);

  const scriptPath = path.join(scriptsDir, script.name);

  try {
    let content = fs.readFileSync(scriptPath, 'utf8');
    let originalContent = content;
    let anyFixed = false;
    const appliedFixes = [];

    // Apply all fixes
    let result = fixUnterminatedTripleQuotes(content, script.name);
    if (result.fixed) {
      content = result.content;
      appliedFixes.push(result.fixType);
      anyFixed = true;
    }

    result = fixMarkdownFooter(content, script.name);
    if (result.fixed) {
      content = result.content;
      appliedFixes.push(result.fixType);
      anyFixed = true;
    }

    result = fixLeadingZeros(content, script.name);
    if (result.fixed) {
      content = result.content;
      appliedFixes.push(result.fixType);
      anyFixed = true;
    }

    result = fixMissingDocstrings(content, script.name);
    if (result.fixed) {
      content = result.content;
      appliedFixes.push(result.fixType);
      anyFixed = true;
    }

    if (anyFixed) {
      // Write fixed content
      fs.writeFileSync(scriptPath, content, 'utf8');
      console.log(`  ✅ FIXED: ${appliedFixes.join(', ')}`);
      fixCount++;
      fixes.push({
        script: script.name,
        fixes: appliedFixes
      });
    } else {
      console.log(`  ⊘  SKIP: No automated fix available (needs manual inspection)`);
      skipCount++;
    }
  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}`);
    skipCount++;
  }
});

console.log();
console.log('='.repeat(80));
console.log('FIX RESULTS');
console.log('='.repeat(80));
console.log(`Total Scripts Processed: ${errorScripts.length}`);
console.log(`✅ Fixed: ${fixCount}`);
console.log(`⊘  Skipped (manual fix needed): ${skipCount}`);
console.log();

if (fixes.length > 0) {
  console.log('Fixes Applied:');
  fixes.forEach(fix => {
    console.log(`  ${fix.script}:`);
    fix.fixes.forEach(f => console.log(`    - ${f}`));
  });
  console.log();
}

console.log('='.repeat(80));
console.log(`✅ AUTOMATED FIXES COMPLETE: ${fixCount} scripts fixed`);
if (skipCount > 0) {
  console.log(`⚠️  ${skipCount} scripts require manual inspection`);
}
console.log('='.repeat(80));

process.exit(fixCount > 0 ? 0 : 1);