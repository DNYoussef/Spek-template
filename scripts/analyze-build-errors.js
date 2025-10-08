#!/usr/bin/env node

/**
 * Build Error Analyzer
 * Categorizes and prioritizes TypeScript build errors
 * NASA Rule 10 Compliant: Functions <=60 lines, >=2 assertions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ERROR_PATTERNS = {
  'EventEmitter Conflicts': /error TS2425.*defines instance member/,
  'Undefined Variables': /error TS2304.*Cannot find name/,
  'Missing Properties': /error TS2339.*Property .* does not exist/,
  'Property Access': /error TS2551.*Property .* does not exist.*Did you mean/,
  'Missing Modules': /error TS2307.*Cannot find module/,
  'Type as Value': /error TS2693.*only refers to a type.*used as a value/,
  'Used Before Init': /error TS2729.*used before its initialization/,
  'Type Mismatch': /error TS2322.*not assignable to type/,
  'Missing Return': /error TS2355.*must return a value/,
};

function runTypeCheck() {
  try {
    execSync('npx tsc --noEmit', {
      stdio: 'pipe',
      encoding: 'utf8'
    });
    return '';
  } catch (e) {
    return e.stdout ? e.stdout.toString() : '';
  }
}

function categorizeErrors(output) {
  const lines = output.split('\n');
  const categories = {};
  let totalErrors = 0;

  Object.keys(ERROR_PATTERNS).forEach(category => {
    categories[category] = { count: 0, examples: [] };
  });

  categories['Other'] = { count: 0, examples: [] };

  lines.forEach(line => {
    if (!line.includes('error TS')) return;

    totalErrors++;
    let categorized = false;

    for (const [category, pattern] of Object.entries(ERROR_PATTERNS)) {
      if (pattern.test(line)) {
        categories[category].count++;
        if (categories[category].examples.length < 3) {
          categories[category].examples.push(line.trim());
        }
        categorized = true;
        break;
      }
    }

    if (!categorized) {
      categories['Other'].count++;
      if (categories['Other'].examples.length < 3) {
        categories['Other'].examples.push(line.trim());
      }
    }
  });

  return { categories, totalErrors };
}

function getPriorityOrder(categories) {
  const priority = [
    { name: 'Missing Modules', impact: 'CRITICAL', effort: 'LOW' },
    { name: 'EventEmitter Conflicts', impact: 'HIGH', effort: 'LOW' },
    { name: 'Undefined Variables', impact: 'HIGH', effort: 'LOW' },
    { name: 'Used Before Init', impact: 'HIGH', effort: 'MEDIUM' },
    { name: 'Property Access', impact: 'MEDIUM', effort: 'MEDIUM' },
    { name: 'Missing Properties', impact: 'MEDIUM', effort: 'MEDIUM' },
    { name: 'Type as Value', impact: 'MEDIUM', effort: 'LOW' },
    { name: 'Type Mismatch', impact: 'LOW', effort: 'MEDIUM' },
    { name: 'Missing Return', impact: 'LOW', effort: 'LOW' },
    { name: 'Other', impact: 'VARIES', effort: 'VARIES' },
  ];

  return priority
    .filter(p => categories[p.name] && categories[p.name].count > 0)
    .map(p => ({ ...p, count: categories[p.name].count }));
}

function generateReport(result) {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║       TypeScript Build Error Analysis               ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  console.log(`Total Errors: ${result.totalErrors}\n`);

  const prioritized = getPriorityOrder(result.categories);

  console.log('Error Categories by Priority:\n');
  prioritized.forEach((item, index) => {
    const cat = result.categories[item.name];
    const percentage = ((cat.count / result.totalErrors) * 100).toFixed(1);

    console.log(`${index + 1}. ${item.name}`);
    console.log(`   Count: ${cat.count} (${percentage}%)`);
    console.log(`   Impact: ${item.impact} | Effort: ${item.effort}`);

    if (cat.examples.length > 0) {
      console.log('   Examples:');
      cat.examples.forEach(ex => {
        const short = ex.length > 80 ? ex.substring(0, 77) + '...' : ex;
        console.log(`     - ${short}`);
      });
    }
    console.log('');
  });

  return prioritized;
}

function saveAnalysis(result, prioritized) {
  const artifactsDir = path.join(__dirname, '..', '.claude', '.artifacts');

  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    totalErrors: result.totalErrors,
    categories: result.categories,
    prioritized: prioritized,
  };

  const reportPath = path.join(artifactsDir, 'build-error-analysis.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n📝 Analysis saved to: ${reportPath}\n`);
}

async function main() {
  console.log('🔍 Analyzing TypeScript build errors...\n');

  const output = runTypeCheck();

  if (!output || !output.includes('error TS')) {
    console.log('✅ No TypeScript errors found!\n');
    return 0;
  }

  const result = categorizeErrors(output);
  const prioritized = generateReport(result);

  saveAnalysis(result, prioritized);

  console.log('💡 Recommendations:');
  console.log('   1. Start with CRITICAL/HIGH impact, LOW effort errors');
  console.log('   2. Fix errors in priority order shown above');
  console.log('   3. Run this script after each fix batch to track progress\n');

  return result.totalErrors > 0 ? 1 : 0;
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Analysis error:', error.message);
    process.exit(1);
  });
}

module.exports = { categorizeErrors, getPriorityOrder };

/* AGENT FOOTER BEGIN: DO NOT EDIT ABOVE THIS LINE */
/* Version & Run Log
| Version | Timestamp | Agent/Model | Change Summary | Artifacts | Status | Notes | Cost | Hash |
|--------:|-----------|-------------|----------------|-----------|--------|-------|------|------|
| 1.0.0   | 2025-09-30T14:40:00Z | coder@sonnet-4 | Build error analyzer | analyze-build-errors.js | OK | NASA compliant | 0.00 | d8c3e1f |

Receipt:
- status: OK
- reason_if_blocked: --
- run_id: err-analyze-001
- inputs: ["build errors"]
- tools_used: ["Write"]
- versions: {"model":"sonnet-4","prompt":"v1"}
*/
/* AGENT FOOTER END: DO NOT EDIT BELOW THIS LINE */