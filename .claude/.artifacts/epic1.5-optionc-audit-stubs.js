#!/usr/bin/env node
/**
 * Epic 1.5 Option C Phase 1: Comprehensive Stub Audit
 *
 * Analyzes all re-export stubs to determine:
 * 1. Which facades are missing
 * 2. Where original implementations are located
 * 3. What files import from broken stubs
 * 4. Redirection strategy for each broken stub
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Utility: Find files with pattern
function findFilesWithPattern(pattern, directory = 'src') {
  try {
    const result = execSync(
      `grep -rl "${pattern}" ${directory} --include="*.ts" 2>/dev/null`,
      { encoding: 'utf8' }
    );
    return result.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

// Utility: Read file safely
function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

// Utility: Check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

// Extract facade name from stub file
function extractFacadeFromStub(stubPath) {
  const content = readFileSafe(stubPath);
  if (!content) return null;

  // Pattern: export * from './SomeFacade'
  const match = content.match(/export\s+\*\s+from\s+['"]([^'"]+Facade)['"]/);
  if (match) {
    return match[1].replace(/^\.\//, '');
  }

  // Pattern: export * from '../facades/SomeFacade'
  const match2 = content.match(/from\s+['"]([^'"]+\/)?([^'"\/]+Facade)['"]/);
  if (match2) {
    return match2[2];
  }

  return null;
}

// Find facade location if it exists
function findFacadeLocation(facadeName) {
  try {
    const result = execSync(
      `find src -name "${facadeName}.ts" -type f 2>/dev/null`,
      { encoding: 'utf8' }
    );
    const matches = result.trim().split('\n').filter(Boolean);
    return matches.length > 0 ? matches[0] : null;
  } catch {
    return null;
  }
}

// Find backup/original file
function findOriginalImplementation(stubPath, facadeName) {
  // Try .backup first
  const backupPath = stubPath + '.backup';
  if (fileExists(backupPath)) {
    return { type: 'backup', path: backupPath };
  }

  // Try component name backup (remove "Facade" suffix)
  const componentName = facadeName.replace(/Facade$/, '');
  const dir = path.dirname(stubPath);
  const componentBackup = path.join(dir, `${componentName}.ts.backup`);
  if (fileExists(componentBackup)) {
    return { type: 'backup', path: componentBackup };
  }

  // Try finding any backup with similar name in directory
  try {
    const result = execSync(
      `find "${dir}" -name "*${componentName}*.backup" 2>/dev/null`,
      { encoding: 'utf8' }
    );
    const matches = result.trim().split('\n').filter(Boolean);
    if (matches.length > 0) {
      return { type: 'backup', path: matches[0] };
    }
  } catch {}

  // Try finding original in subdirectory (FSM pattern)
  const fsmPath = path.join(dir, facadeName.replace(/Facade$/, ''), `${facadeName}.ts`);
  if (fileExists(fsmPath)) {
    return { type: 'fsm', path: fsmPath };
  }

  return null;
}

// Find files importing from stub
function findImporters(stubPath) {
  const stubDir = path.dirname(stubPath);
  const stubName = path.basename(stubPath, '.ts');

  try {
    // Search for imports from this stub
    const result = execSync(
      `grep -rl "from ['\"].*/${stubName}['\"]" src --include="*.ts" 2>/dev/null`,
      { encoding: 'utf8' }
    );
    return result.trim().split('\n').filter(Boolean).filter(f => f !== stubPath);
  } catch {
    return [];
  }
}

// Main audit
async function auditStubs() {
  console.log('=== Epic 1.5 Option C: Stub Audit ===\n');

  // Find all stubs
  const stubFiles = findFilesWithPattern('ELIMINATED GOD OBJECT|ANNIHILATED GOD OBJECT');
  console.log(`Found ${stubFiles.length} stub files\n`);

  const audit = {
    timestamp: new Date().toISOString(),
    totalStubs: stubFiles.length,
    analyzed: [],
    summary: {
      facadesExist: 0,
      facadesMissing: 0,
      originalsFound: 0,
      originalsNotFound: 0,
      hasImporters: 0,
      noImporters: 0
    }
  };

  let processed = 0;
  for (const stubPath of stubFiles) {
    processed++;
    if (processed % 20 === 0) {
      console.log(`Progress: ${processed}/${stubFiles.length}...`);
    }

    const facadeName = extractFacadeFromStub(stubPath);
    if (!facadeName) {
      continue; // Not a facade re-export stub
    }

    const facadeLocation = findFacadeLocation(facadeName);
    const originalImplementation = findOriginalImplementation(stubPath, facadeName);
    const importers = findImporters(stubPath);

    const entry = {
      stubFile: stubPath,
      facadeName,
      facadeExists: !!facadeLocation,
      facadeLocation: facadeLocation || null,
      originalExists: !!originalImplementation,
      originalType: originalImplementation?.type || null,
      originalPath: originalImplementation?.path || null,
      importerCount: importers.length,
      importers: importers.length > 0 ? importers : [],
      status: null,
      recommendation: null
    };

    // Determine status and recommendation
    if (facadeLocation) {
      entry.status = 'FACADE_EXISTS';
      entry.recommendation = 'Update import path to point to ' + facadeLocation;
      audit.summary.facadesExist++;
    } else if (originalImplementation) {
      entry.status = 'FACADE_MISSING_ORIGINAL_FOUND';
      entry.recommendation = `Redirect to ${originalImplementation.type}: ${originalImplementation.path}`;
      audit.summary.facadesMissing++;
      audit.summary.originalsFound++;
    } else {
      entry.status = 'FACADE_MISSING_ORIGINAL_NOT_FOUND';
      entry.recommendation = 'Check git history or create minimal stub';
      audit.summary.facadesMissing++;
      audit.summary.originalsNotFound++;
    }

    if (importers.length > 0) {
      audit.summary.hasImporters++;
    } else {
      audit.summary.noImporters++;
    }

    audit.analyzed.push(entry);
  }

  console.log('\n=== AUDIT SUMMARY ===');
  console.log(`Total stubs analyzed: ${audit.analyzed.length}`);
  console.log(`\nFacades:`);
  console.log(`  - Exist: ${audit.summary.facadesExist}`);
  console.log(`  - Missing: ${audit.summary.facadesMissing}`);
  console.log(`\nOriginal implementations:`);
  console.log(`  - Found: ${audit.summary.originalsFound}`);
  console.log(`  - Not found: ${audit.summary.originalsNotFound}`);
  console.log(`\nImporters:`);
  console.log(`  - Stubs with importers: ${audit.summary.hasImporters}`);
  console.log(`  - Stubs without importers: ${audit.summary.noImporters}`);

  // Write full audit
  const auditPath = '.claude/.artifacts/epic1.5-optionc-audit-results.json';
  fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2));
  console.log(`\nFull audit saved: ${auditPath}`);

  // Create actionable categories
  const actionable = {
    safeToDelete: audit.analyzed.filter(e => e.importers.length === 0),
    needRedirection: audit.analyzed.filter(e =>
      e.importers.length > 0 && (e.facadeExists || e.originalExists)
    ),
    needInvestigation: audit.analyzed.filter(e =>
      e.importers.length > 0 && !e.facadeExists && !e.originalExists
    )
  };

  console.log(`\n=== ACTIONABLE CATEGORIES ===`);
  console.log(`Safe to delete (no importers): ${actionable.safeToDelete.length}`);
  console.log(`Need redirection (have target): ${actionable.needRedirection.length}`);
  console.log(`Need investigation (no target): ${actionable.needInvestigation.length}`);

  // Write actionable report
  const actionablePath = '.claude/.artifacts/epic1.5-optionc-actionable.json';
  fs.writeFileSync(actionablePath, JSON.stringify(actionable, null, 2));
  console.log(`\nActionable report: ${actionablePath}`);

  return { audit, actionable };
}

// Execute
auditStubs().then(({ audit, actionable }) => {
  console.log('\n✅ Phase 1 Complete: Stub audit finished');
  console.log(`\nNext: Review ${actionable.needInvestigation.length} cases needing investigation`);
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
