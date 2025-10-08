/**
 * Automated TS18046 Error Fix Script
 * Adds error type guards to all catch blocks
 */
const fs = require('fs');
const path = require('path');

// Pattern to match: error.message without type guard
const ERROR_MESSAGE_PATTERN = /(\} catch \(error\) \{[\s\S]*?)error\.message/g;
const ERROR_CODE_PATTERN = /(\} catch \(error\) \{[\s\S]*?)error\.code/g;
const ERROR_STACK_PATTERN = /(\} catch \(error\) \{[\s\S]*?)error\.stack/g;

// Replacement template
const TYPE_GUARD_TEMPLATE = `const errorMessage = error instanceof Error ? error.message : String(error);`;
const CODE_GUARD_TEMPLATE = `const errorCode = (error as any)?.code;`;
const STACK_GUARD_TEMPLATE = `const errorStack = error instanceof Error ? error.stack : undefined;`;

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Find all catch blocks
    const catchBlocks = content.matchAll(/\} catch \(error\) \{([^}]*\{[^}]*\}[^}]*)*[^}]*\}/g);

    for (const match of Array.from(catchBlocks)) {
      const block = match[0];

      // Check if already has type guard
      if (block.includes('error instanceof Error') || block.includes('errorMessage')) {
        continue;
      }

      // Check if uses error.message
      if (block.includes('error.message')) {
        const lines = block.split('\n');
        const catchLine = lines.findIndex(l => l.includes('} catch (error) {'));

        if (catchLine >= 0 && !lines[catchLine + 1].includes('const errorMessage')) {
          // Insert type guard after catch line
          lines.splice(catchLine + 1, 0, '      ' + TYPE_GUARD_TEMPLATE);

          // Replace error.message with errorMessage
          for (let i = catchLine + 2; i < lines.length; i++) {
            lines[i] = lines[i].replace(/error\.message/g, 'errorMessage');
          }

          const newBlock = lines.join('\n');
          content = content.replace(block, newBlock);
          modified = true;
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
      return 1;
    }

    return 0;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function processDirectory(dir) {
  let fixCount = 0;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      fixCount += processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      fixCount += processFile(fullPath);
    }
  }

  return fixCount;
}

// Main execution
const srcDir = path.join(__dirname, '../src');
console.log('Starting TS18046 error fixes...');
const totalFixes = processDirectory(srcDir);
console.log(`\nTotal files fixed: ${totalFixes}`);