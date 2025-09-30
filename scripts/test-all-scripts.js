/**
 * Comprehensive Script Testing & Documentation
 * Tests 299 utility scripts and generates inventory
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('='.repeat(80));
console.log('UTILITY SCRIPTS COMPREHENSIVE TEST & INVENTORY');
console.log('='.repeat(80));
console.log();

const scriptsDir = path.join(__dirname);
const results = {
  totalScripts: 0,
  tested: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  byType: { sh: 0, js: 0, py: 0 },
  byCategory: {},
  inventory: []
};

// Get all script files
const getAllScripts = () => {
  const files = fs.readdirSync(scriptsDir);
  return files.filter(file => {
    const ext = path.extname(file);
    return ['.sh', '.js', '.py'].includes(ext);
  }).map(file => ({
    name: file,
    path: path.join(scriptsDir, file),
    ext: path.extname(file),
    size: fs.statSync(path.join(scriptsDir, file)).size
  }));
};

// Categorize script by name pattern
const categorizeScript = (filename) => {
  const name = filename.toLowerCase();
  if (name.includes('test')) return 'testing';
  if (name.includes('build') || name.includes('compile')) return 'build';
  if (name.includes('analyze') || name.includes('analyzer')) return 'analysis';
  if (name.includes('fix') || name.includes('repair')) return 'fixes';
  if (name.includes('nasa') || name.includes('compliance')) return 'compliance';
  if (name.includes('dspy') || name.includes('optimization')) return 'optimization';
  if (name.includes('swarm') || name.includes('agent')) return 'agent-coordination';
  if (name.includes('loop') || name.includes('workflow')) return 'workflow';
  if (name.includes('security') || name.includes('audit')) return 'security';
  if (name.includes('deploy') || name.includes('release')) return 'deployment';
  return 'utility';
};

// Test script validity (syntax check only)
const testScript = (script) => {
  try {
    if (script.ext === '.js') {
      // JavaScript syntax check
      execSync(`node --check "${script.path}"`, { stdio: 'pipe' });
      return { status: 'valid', error: null };
    } else if (script.ext === '.py') {
      // Python syntax check
      execSync(`python -m py_compile "${script.path}"`, { stdio: 'pipe' });
      return { status: 'valid', error: null };
    } else if (script.ext === '.sh') {
      // Bash syntax check
      execSync(`bash -n "${script.path}"`, { stdio: 'pipe' });
      return { status: 'valid', error: null };
    }
  } catch (error) {
    return { status: 'invalid', error: error.message };
  }
  return { status: 'skipped', error: 'Unknown type' };
};

// Extract description from script header
const getDescription = (scriptPath, ext) => {
  try {
    const content = fs.readFileSync(scriptPath, 'utf8');
    const lines = content.split('\n').slice(0, 20);

    for (const line of lines) {
      const trimmed = line.trim();
      if (ext === '.js' && (trimmed.startsWith('*') || trimmed.startsWith('//'))) {
        const desc = trimmed.replace(/^[*\/]+\s*/, '').trim();
        if (desc.length > 10 && !desc.includes('Copyright') && !desc.includes('SPEK')) {
          return desc;
        }
      } else if (ext === '.py' && trimmed.startsWith('#')) {
        const desc = trimmed.replace(/^#+\s*/, '').trim();
        if (desc.length > 10 && !desc.includes('!/usr/bin')) {
          return desc;
        }
      } else if (ext === '.sh' && trimmed.startsWith('#') && !trimmed.startsWith('#!')) {
        const desc = trimmed.replace(/^#+\s*/, '').trim();
        if (desc.length > 10) {
          return desc;
        }
      }
    }
  } catch (error) {
    // Ignore read errors
  }
  return 'No description available';
};

// Main execution
console.log('📂 Scanning scripts directory...');
const scripts = getAllScripts();
results.totalScripts = scripts.length;

console.log(`Found ${scripts.length} scripts\n`);
console.log('🔍 Testing scripts (syntax validation only)...\n');

scripts.forEach((script, index) => {
  const category = categorizeScript(script.name);
  results.byType[script.ext.replace('.', '')] = (results.byType[script.ext.replace('.', '')] || 0) + 1;
  results.byCategory[category] = (results.byCategory[category] || 0) + 1;

  process.stdout.write(`\r[${index + 1}/${scripts.length}] Testing ${script.name}...`);

  const testResult = testScript(script);
  const description = getDescription(script.path, script.ext);

  results.tested++;
  if (testResult.status === 'valid') {
    results.passed++;
  } else if (testResult.status === 'invalid') {
    results.failed++;
  } else {
    results.skipped++;
  }

  results.inventory.push({
    name: script.name,
    type: script.ext.replace('.', ''),
    category: category,
    size: script.size,
    status: testResult.status,
    error: testResult.error,
    description: description
  });
});

console.log('\n\n' + '='.repeat(80));
console.log('TEST RESULTS SUMMARY');
console.log('='.repeat(80));
console.log(`Total Scripts: ${results.totalScripts}`);
console.log(`Tested: ${results.tested}`);
console.log(`✅ Valid: ${results.passed}`);
console.log(`❌ Invalid: ${results.failed}`);
console.log(`⊘  Skipped: ${results.skipped}`);
console.log();

console.log('By Type:');
Object.entries(results.byType).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});
console.log();

console.log('By Category:');
Object.entries(results.byCategory).sort((a, b) => b[1] - a[1]).forEach(([category, count]) => {
  console.log(`  ${category}: ${count}`);
});
console.log();

// Generate detailed report
const reportPath = path.join(__dirname, '../.claude/.artifacts/scripts-inventory-report.json');
const markdownPath = path.join(__dirname, '../.claude/.artifacts/scripts-inventory-report.md');

// JSON report
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`📊 Detailed JSON report: ${reportPath}`);

// Markdown report
let markdown = `# Utility Scripts Inventory Report

**Generated**: ${new Date().toISOString()}
**Total Scripts**: ${results.totalScripts}

## Summary

- ✅ Valid Syntax: ${results.passed} (${((results.passed / results.totalScripts) * 100).toFixed(1)}%)
- ❌ Invalid Syntax: ${results.failed} (${((results.failed / results.totalScripts) * 100).toFixed(1)}%)
- ⊘  Skipped: ${results.skipped}

## By File Type

| Type | Count | Percentage |
|------|-------|------------|
`;

Object.entries(results.byType).forEach(([type, count]) => {
  markdown += `| ${type} | ${count} | ${((count / results.totalScripts) * 100).toFixed(1)}% |\n`;
});

markdown += `\n## By Category\n\n| Category | Count | Scripts |\n|----------|-------|----------|\n`;

const categoryCounts = {};
results.inventory.forEach(item => {
  if (!categoryCounts[item.category]) {
    categoryCounts[item.category] = [];
  }
  categoryCounts[item.category].push(item.name);
});

Object.entries(categoryCounts).sort((a, b) => b[1].length - a[1].length).forEach(([category, scripts]) => {
  markdown += `| ${category} | ${scripts.length} | ${scripts.slice(0, 3).join(', ')}${scripts.length > 3 ? '...' : ''} |\n`;
});

markdown += `\n## Complete Inventory\n\n`;

// Group by category for markdown
Object.entries(categoryCounts).sort((a, b) => b[1].length - a[1].length).forEach(([category, scriptNames]) => {
  markdown += `### ${category.charAt(0).toUpperCase() + category.slice(1)} (${scriptNames.length})\n\n`;
  markdown += `| Script | Type | Status | Description |\n|--------|------|--------|-------------|\n`;

  scriptNames.forEach(name => {
    const item = results.inventory.find(i => i.name === name);
    const statusIcon = item.status === 'valid' ? '✅' : item.status === 'invalid' ? '❌' : '⊘';
    markdown += `| ${item.name} | ${item.type} | ${statusIcon} | ${item.description.substring(0, 60)}${item.description.length > 60 ? '...' : ''} |\n`;
  });

  markdown += `\n`;
});

// Add failed scripts section if any
if (results.failed > 0) {
  markdown += `## ⚠️ Scripts with Syntax Errors\n\n`;
  markdown += `| Script | Type | Error |\n|--------|------|-------|\n`;
  results.inventory.filter(i => i.status === 'invalid').forEach(item => {
    const errorMsg = (item.error || 'Unknown error').substring(0, 100);
    markdown += `| ${item.name} | ${item.type} | ${errorMsg} |\n`;
  });
  markdown += `\n`;
}

markdown += `## Recommendations

### High Priority Scripts (Must Work)
- **testing**: ${results.byCategory.testing || 0} scripts
- **build**: ${results.byCategory.build || 0} scripts
- **compliance**: ${results.byCategory.compliance || 0} scripts

### Medium Priority
- **analysis**: ${results.byCategory.analysis || 0} scripts
- **fixes**: ${results.byCategory.fixes || 0} scripts
- **workflow**: ${results.byCategory.workflow || 0} scripts

### Lower Priority
- **utility**: ${results.byCategory.utility || 0} scripts
- **deployment**: ${results.byCategory.deployment || 0} scripts

## Next Steps

1. Fix ${results.failed} scripts with syntax errors
2. Test execution of high-priority scripts
3. Document script dependencies
4. Create script usage guide
`;

fs.writeFileSync(markdownPath, markdown);
console.log(`📄 Detailed markdown report: ${markdownPath}`);
console.log();

console.log('='.repeat(80));
if (results.failed === 0) {
  console.log('✅ ALL SCRIPTS HAVE VALID SYNTAX!');
  process.exit(0);
} else {
  console.log(`⚠️  ${results.failed} SCRIPTS HAVE SYNTAX ERRORS - SEE REPORT FOR DETAILS`);
  process.exit(1);
}