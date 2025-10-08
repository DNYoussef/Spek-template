#!/usr/bin/env node
/**
 * Epic 1.5 Batch 2A: Fix Facade Import Paths
 * Corrects import paths for 25 facades that exist but have wrong references
 *
 * Strategy:
 * 1. Find all re-export stub files with facade imports
 * 2. For each facade import, locate actual facade file
 * 3. Calculate correct relative path
 * 4. Update import statement
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Facades that exist (from analysis)
const EXISTING_FACADES = [
  'AdaptivePerformanceOptimizerFacade',
  'AdaptiveThresholdManagerFacade',
  'AgentMonitorFacade',
  'ArtifactSystemIntegrationFSMFacade',
  'BenchmarkCLIFacade',
  'CICDPerformanceBenchmarkerFacade',
  'CICDPipelineManagerFacade',
  'CodexQualityEnhancerFacade',
  'CodexSandboxValidatorFacade',
  'CodexTheaterAuditorFacade',
  'CommunicationSecurityFacade',
  'CompilationErrorResolverFacade',
  'ConflictResolverFacade',
  'ContextStoreFacade',
  'CoordinationHubFacade',
  'CoordinationPrincessFacade',
  'MemoryOptimizerFacade',
  'MigrationPlannerFacade',
  'PrincessCoordinatorFacade',
  'ReportGeneratorCoreFacade',
  'ReportGeneratorFacade',
  'StateTransitionMonitorFacade',
  'WorkflowExecutorFacade',
  'WorkflowMonitorFacade',
  'WorkflowValidatorFacade'
];

// Find facade location
function findFacadeLocation(facadeName) {
  try {
    const result = execSync(`find src -name "${facadeName}.ts" -type f`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    return result.trim().split('\n')[0] || null;
  } catch (error) {
    return null;
  }
}

// Calculate relative path from source to target
function calculateRelativePath(fromFile, toFile) {
  const fromDir = path.dirname(fromFile);
  const relativePath = path.relative(fromDir, toFile);
  // Convert Windows paths to Unix and remove .ts extension
  return relativePath.replace(/\\/g, '/').replace(/\.ts$/, '');
}

// Find files that import a specific facade
function findFilesImportingFacade(facadeName) {
  try {
    const grepPattern = `from ['\"]\\./.*${facadeName}['\"]`;
    const result = execSync(
      `grep -rl "${grepPattern}" src --include="*.ts"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    return result.trim().split('\n').filter(Boolean);
  } catch (error) {
    // Try alternate pattern
    try {
      const result2 = execSync(
        `grep -rl "${facadeName}" src --include="*.ts" | xargs grep -l "export.*from.*${facadeName}"`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      );
      return result2.trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }
}

// Update import in file
function updateImportInFile(filePath, oldImport, newImport) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const updated = content
      .replace(
        new RegExp(`from ['"]${oldImport.replace(/\//g, '\\/')}['"]`, 'g'),
        `from '${newImport}'`
      )
      .replace(
        new RegExp(`from [""]${oldImport.replace(/\//g, '\\/')}[""]`, 'g'),
        `from "${newImport}"`
      );

    if (content !== updated) {
      fs.writeFileSync(filePath, updated, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('=== Epic 1.5 Batch 2A: Facade Path Correction ===\n');

  let totalFixed = 0;
  let totalAttempted = 0;
  const results = [];

  for (const facadeName of EXISTING_FACADES) {
    console.log(`\nProcessing: ${facadeName}`);

    // Find actual facade location
    const facadeLocation = findFacadeLocation(facadeName);
    if (!facadeLocation) {
      console.log(`  ⚠️  Facade file not found (skipping)`);
      results.push({ facade: facadeName, status: 'NOT_FOUND', fixed: 0 });
      continue;
    }

    console.log(`  ✓ Found at: ${facadeLocation}`);

    // Find files importing this facade
    const importingFiles = findFilesImportingFacade(facadeName);
    if (importingFiles.length === 0) {
      console.log(`  ℹ️  No files importing this facade`);
      results.push({ facade: facadeName, status: 'NO_IMPORTS', fixed: 0 });
      continue;
    }

    console.log(`  → Found ${importingFiles.length} file(s) with imports`);

    let facadeFixed = 0;
    for (const importingFile of importingFiles) {
      // Calculate correct relative path
      const correctPath = calculateRelativePath(importingFile, facadeLocation);
      const oldPattern = `./${facadeName}`;

      totalAttempted++;
      if (updateImportInFile(importingFile, oldPattern, correctPath)) {
        facadeFixed++;
        totalFixed++;
        console.log(`    ✓ Fixed: ${importingFile}`);
        console.log(`      ${oldPattern} → ${correctPath}`);
      }
    }

    results.push({
      facade: facadeName,
      status: facadeFixed > 0 ? 'FIXED' : 'NO_CHANGES',
      fixed: facadeFixed,
      location: facadeLocation
    });
  }

  // Summary report
  console.log('\n=== SUMMARY ===');
  console.log(`Total facades processed: ${EXISTING_FACADES.length}`);
  console.log(`Total import fixes: ${totalFixed}/${totalAttempted}`);
  console.log(`\nBy status:`);
  const statusCounts = results.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });

  // Write detailed report
  const reportPath = '.claude/.artifacts/epic1.5-batch2a-results.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalFacades: EXISTING_FACADES.length,
    totalFixed,
    totalAttempted,
    results
  }, null, 2));

  console.log(`\nDetailed report: ${reportPath}`);

  return { totalFixed, totalAttempted };
}

main().then(({ totalFixed, totalAttempted }) => {
  console.log(`\n✅ Epic 1.5 Batch 2A Complete: ${totalFixed}/${totalAttempted} imports fixed`);
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
