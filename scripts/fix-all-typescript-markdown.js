#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Finding all TypeScript files with markdown content...');

// Find all TypeScript files with markdown headers
const findCommand = 'find src/architecture/langgraph/ -name "*.ts" -exec grep -l "### " {} \\;';
let filesToFix = [];

try {
  const result = execSync(findCommand, { encoding: 'utf8' });
  filesToFix = result.trim().split('\n').filter(f => f);
} catch (error) {
  console.log('No files with markdown headers found or error occurred');
}

console.log(`Found ${filesToFix.length} files to fix`);

let fixedCount = 0;
let errorCount = 0;

for (const file of filesToFix) {
  const filePath = path.join(process.cwd(), file);

  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${file}`);
      continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Fix markdown headers in comments
    content = content.replace(/^### Receipt$/gm, '// Receipt');
    content = content.replace(/^###\s+(.*)$/gm, '// $1');

    // Fix markdown list items to comments
    content = content.replace(/^- status:\s*(.*)$/gm, '// status: $1');
    content = content.replace(/^- reason_if_blocked:\s*(.*)$/gm, '// reason_if_blocked: $1');
    content = content.replace(/^- run_id:\s*(.*)$/gm, '// run_id: $1');
    content = content.replace(/^- inputs:\s*(.*)$/gm, '// inputs: $1');
    content = content.replace(/^- tools_used:\s*(.*)$/gm, '// tools_used: $1');
    content = content.replace(/^- versions:\s*(.*)$/gm, '// versions: $1');

    // Fix any remaining unindented list items
    content = content.replace(/^-\s+(.*)$/gm, '// $1');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${file}`);
      fixedCount++;
    } else {
      console.log(`⏭️  No changes needed: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${file}: ${error.message}`);
    errorCount++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   Fixed: ${fixedCount} files`);
console.log(`   Errors: ${errorCount} files`);
console.log(`   Total: ${filesToFix.length} files processed`);

process.exit(errorCount > 0 ? 1 : 0);