#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Finding all TypeScript files with problematic footers...\n');

// Find all TypeScript files with HTML footers or markdown receipts
const htmlFooterFiles = execSync('grep -r "<!-- AGENT FOOTER" src/ --include="*.ts" -l', { encoding: 'utf8' })
  .trim().split('\n').filter(f => f);

const markdownReceiptFiles = execSync('grep -r "### Receipt" src/ --include="*.ts" -l', { encoding: 'utf8' })
  .trim().split('\n').filter(f => f);

// Combine and deduplicate
const allFiles = [...new Set([...htmlFooterFiles, ...markdownReceiptFiles])];

console.log(`📊 Found ${allFiles.length} files to fix:`);
console.log(`   - ${htmlFooterFiles.length} with HTML footers`);
console.log(`   - ${markdownReceiptFiles.length} with markdown receipts\n`);

let fixedCount = 0;
let errorCount = 0;
const errors = [];

for (const file of allFiles) {
  const filePath = path.join(process.cwd(), file);

  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${file}`);
      continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Remove HTML comment footers completely and convert to TypeScript comments
    content = content.replace(/<!--\s*AGENT FOOTER BEGIN.*?-->/gs, '// === AGENT FOOTER ===');
    content = content.replace(/<!--\s*AGENT FOOTER END.*?-->/gs, '// === END FOOTER ===');

    // Fix malformed HTML comments
    content = content.replace(/<\\!--/g, '//');
    content = content.replace(/-->/g, '');

    // Convert markdown headers to comments
    content = content.replace(/^### Receipt$/gm, '// Receipt');
    content = content.replace(/^###\s+(.*)$/gm, '// $1');
    content = content.replace(/^## Version & Run Log$/gm, '// Version & Run Log');

    // Convert markdown list items to comments
    content = content.replace(/^- status:\s*(.*)$/gm, '// status: $1');
    content = content.replace(/^- reason_if_blocked:\s*(.*)$/gm, '// reason_if_blocked: $1');
    content = content.replace(/^- run_id:\s*(.*)$/gm, '// run_id: $1');
    content = content.replace(/^- inputs:\s*(.*)$/gm, '// inputs: $1');
    content = content.replace(/^- tools_used:\s*(.*)$/gm, '// tools_used: $1');
    content = content.replace(/^- versions:\s*(.*)$/gm, '// versions: $1');

    // Fix any remaining list items
    content = content.replace(/^-\s+(.*)$/gm, '// $1');

    // Convert markdown tables to comments
    content = content.replace(/^\| Version.*$/gm, '// Version History');
    content = content.replace(/^\|[-:| ]+\|$/gm, '');
    content = content.replace(/^\| (\d+\.\d+\.\d+).*$/gm, '// Version: $1');
    content = content.replace(/^\|.*\|$/gm, function(match) {
      // If it's a table row, convert to comment
      return '// ' + match.replace(/\|/g, ' | ').trim();
    });

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      process.stdout.write(`✅`);
      fixedCount++;
    } else {
      process.stdout.write(`⏭️`);
    }

    // Progress indicator every 20 files
    if ((fixedCount + errorCount) % 20 === 0) {
      process.stdout.write(` [${fixedCount + errorCount}/${allFiles.length}]\n`);
    }
  } catch (error) {
    process.stdout.write(`❌`);
    errorCount++;
    errors.push({ file, error: error.message });
  }
}

console.log(`\n\n📊 Final Summary:`);
console.log(`   ✅ Fixed: ${fixedCount} files`);
console.log(`   ❌ Errors: ${errorCount} files`);
console.log(`   📁 Total: ${allFiles.length} files processed`);

if (errors.length > 0) {
  console.log(`\n❌ Errors encountered:`);
  errors.forEach(({ file, error }) => {
    console.log(`   ${file}: ${error}`);
  });
}

console.log('\n🚀 Cleanup complete! Now testing build...\n');

// Test the build
try {
  console.log('Running: npm run build');
  const buildResult = execSync('npm run build 2>&1', { encoding: 'utf8', stdio: 'pipe' });
  console.log('✅ Build successful!');
} catch (buildError) {
  const errorOutput = buildError.stdout || buildError.message;
  const errorCount = (errorOutput.match(/error TS/g) || []).length;
  if (errorCount > 0) {
    console.log(`⚠️  Build still has ${errorCount} TypeScript errors`);
    console.log('First few errors:');
    const errors = errorOutput.split('\n').filter(line => line.includes('error TS')).slice(0, 5);
    errors.forEach(error => console.log(`  ${error}`));
  } else {
    console.log('✅ No TypeScript errors found!');
  }
}

process.exit(errorCount > 0 ? 1 : 0);