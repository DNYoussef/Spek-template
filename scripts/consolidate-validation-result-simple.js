#!/usr/bin/env node
/**
 * Simple ValidationResult Consolidation Script
 * String-based replacement with careful validation
 *
 * Strategy:
 * 1. Check if file has "export interface ValidationResult"
 * 2. Check if already has import from validation-types
 * 3. Remove interface block (with brace matching)
 * 4. Add import after last import or at top
 */

const fs = require('fs');
const path = require('path');

const CANONICAL_IMPORT = "import { ValidationResult } from '~types/validation-types';";

/**
 * Find the complete interface block (export interface ValidationResult { ... })
 */
function findInterfaceBlock(content) {
  const exportRegex = /export\s+interface\s+ValidationResult\s*(\{|extends)/;
  const match = content.match(exportRegex);

  if (!match) {
    return null;
  }

  const startIndex = match.index;

  // Find matching closing brace
  let braceCount = 0;
  let inInterface = false;
  let endIndex = startIndex;

  for (let i = startIndex; i < content.length; i++) {
    const char = content[i];

    if (char === '{') {
      braceCount++;
      inInterface = true;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0 && inInterface) {
        endIndex = i + 1;
        break;
      }
    }
  }

  if (!inInterface || braceCount !== 0) {
    return null; // Malformed interface
  }

  return {
    start: startIndex,
    end: endIndex,
    text: content.slice(startIndex, endIndex)
  };
}

/**
 * Find import insertion position (after last import)
 */
function findImportInsertPosition(content) {
  const importRegex = /^import\s+.+?;$/gm;
  let lastImportEnd = 0;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    lastImportEnd = match.index + match[0].length;
  }

  return lastImportEnd;
}

/**
 * Check if file already has canonical import
 */
function hasCanonicalImport(content) {
  return content.includes("from '~types/validation-types'") ||
         content.includes('from "~types/validation-types"') ||
         content.includes("from '@/types/validation-types'") ||
         content.includes('from "../types/validation-types"') ||
         content.includes("from '~/types/validation-types'") ||
         content.includes('from "~/types/validation-types"');
}

/**
 * Consolidate single file
 */
function consolidateFile(filePath, dryRun = true) {
  // Skip canonical file
  if (filePath.includes('src/types/validation-types.ts') || filePath.includes('src\\types\\validation-types.ts')) {
    return { skipped: true, reason: 'Canonical file' };
  }

  // Read file
  const content = fs.readFileSync(filePath, 'utf-8');

  // Check for existing import
  if (hasCanonicalImport(content)) {
    return { skipped: true, reason: 'Already has canonical import' };
  }

  // Find ValidationResult interface
  const interfaceBlock = findInterfaceBlock(content);

  if (!interfaceBlock) {
    return { skipped: true, reason: 'No ValidationResult interface found' };
  }

  // Find import position
  const importPosition = findImportInsertPosition(content);

  // Build new content
  let newContent;

  if (importPosition === 0) {
    // No existing imports - add at top
    newContent =
      CANONICAL_IMPORT + '\n\n' +
      content.slice(0, interfaceBlock.start) +
      content.slice(interfaceBlock.end);
  } else {
    // Add after existing imports
    const beforeImports = content.slice(0, importPosition);
    const betweenImportsAndInterface = content.slice(importPosition, interfaceBlock.start);
    const afterInterface = content.slice(interfaceBlock.end);

    newContent =
      beforeImports + '\n' +
      CANONICAL_IMPORT +
      betweenImportsAndInterface +
      afterInterface;
  }

  // Clean up extra newlines
  newContent = newContent.replace(/\n{4,}/g, '\n\n\n'); // Max 3 newlines

  // Show diff if dry run
  if (dryRun) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`FILE: ${filePath}`);
    console.log('='.repeat(60));
    console.log('\nREMOVED:');
    interfaceBlock.text.split('\n').forEach(line => {
      console.log(`  - ${line}`);
    });
    console.log('\nADDED:');
    console.log(`  + ${CANONICAL_IMPORT}`);
    console.log(`\nImport position: ${importPosition === 0 ? 'Top of file' : 'After line ' + content.slice(0, importPosition).split('\n').length}`);

    return { modified: true, dryRun: true };
  }

  // Write file
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`✓ Modified: ${filePath}`);

  return { modified: true, dryRun: false };
}

/**
 * Process batch of files
 */
function processBatch(files, dryRun = true) {
  const results = {
    modified: [],
    skipped: [],
    errors: []
  };

  for (const file of files) {
    try {
      const fullPath = path.resolve(file);

      if (!fs.existsSync(fullPath)) {
        results.errors.push({ file, error: 'File not found' });
        continue;
      }

      const result = consolidateFile(fullPath, dryRun);

      if (result.skipped) {
        results.skipped.push({ file, reason: result.reason });
      } else if (result.modified) {
        results.modified.push(file);
      }
    } catch (error) {
      results.errors.push({ file, error: error.message });
      console.error(`\n✗ Error processing ${file}:`);
      console.error(`  ${error.message}`);
    }
  }

  return results;
}

/**
 * Main CLI
 */
function main() {
  const args = process.argv.slice(2);

  // Determine mode
  const dryRun = !args.includes('--execute');
  const batchMode = args.find(arg => arg.startsWith('--batch='));

  // Define batches
  const batches = {
    pilot: [
      'src/types/DatasetTypes.ts',
      'src/types/DegradationTypes.ts',
      'src/types/base/common.ts',
      'src/types/base/shared.ts'
      // Note: src/context/degradation/types/DegradationTypes.ts already has import
    ],
    integration: [
      'src/dspy-integration/types/DSPyTypes.ts',
      'src/dspy-integration/types/dspy-integration.types.ts',
      'src/dspy-integration/types/DatasetTypes.ts',
      'src/dspy-integration/core/SignatureValidator.ts',
      'src/dspy-integration/signatures/PrincessDroneSignatures.ts',
      'src/dspy-integration/claude-md/SystemWideValidator.ts',
      'src/dspy-integration/batch/OptimizationValidator.ts',
      'src/dspy-integration/a2a-context-dna/interfaces/types.ts',
      'src/integrations/ArtifactSystemIntegration.ts',
      'src/domains/quality-gates/integrations/ArtifactSystemIntegration.ts'
    ],
    fsm: [
      'src/validation/fsm/types/ValidationFSMTypes.ts',
      'src/events/fsm/types/EventFSMTypes.ts',
      'src/fsm/orchestration/ValidationStates.ts',
      'src/fsm/orchestration/StateGuardValidator.ts',
      'src/protocols/docs/fsm/DocGeneratorTypes.ts',
      'src/orchestration/integration/fsm/types/IntegrationFSMTypes.ts',
      'src/migration/translation/fsm/MessageFormatTypes.ts',
      'src/shared/mega-fsm/types/MegaDecompositionTypes.ts',
      'src/architecture/langgraph/workflows/validation/WorkflowValidator.ts',
      'src/architecture/langgraph/workflows/orchestration/WorkflowValidatorFacade.ts',
      'src/architecture/langgraph/workflows/orchestration/WorkflowTypes.ts',
      'src/architecture/langgraph/testing/ValidationSuite.ts',
      'src/architecture/langgraph/testing/types/ValidationFSM.types.ts'
    ],
    migration: [
      'src/migration/translation/protocol-components/ProtocolTranslatorTypes.ts',
      'src/migration/strategies/canary/handlers/CanaryValidationHandler.ts',
      'src/migration/planning/risk/reporting/types/ReportingTypes.ts',
      'src/analysis/core/types/AnalysisTypes.ts',
      'src/orchestration/integration/unified/IntegrationFSMCore.ts',
      'src/orchestration/integration/dependency/DependencyTypes.ts',
      'src/orchestration/deployment/readiness/types/ReadinessTypes.ts',
      'src/orchestration/phases/phase-transition/PhaseTransitionTypesFacade.ts',
      'src/orchestration/quality/interfaces/IQualityGateRegistry.ts'
    ],
    remaining: [
      'src/workflow/core/WorkflowValidator.ts',
      'src/workflow/core/StepExecutor.ts',
      'src/validation/stages/ValidationEngine.ts',
      'src/validation/context/SchemaValidator.ts',
      'src/config/types/ConfigTypes.ts',
      'src/utilities/validation/index.ts',
      'src/compliance/monitoring/ComplianceDriftDetector-typed.ts',
      'src/swarm/testing/SandboxTestingFramework.ts',
      'src/context/ContextDNA.ts',
      'src/routing/components/RoutingValidationEngine.ts'
    ]
  };

  // Select files to process
  let filesToProcess = [];
  let batchName = 'pilot';

  if (batchMode) {
    batchName = batchMode.split('=')[1];
    if (!batches[batchName]) {
      console.error(`Error: Unknown batch '${batchName}'`);
      console.error(`Available batches: ${Object.keys(batches).join(', ')}`);
      process.exit(1);
    }
    filesToProcess = batches[batchName];
  } else if (args.includes('--all')) {
    filesToProcess = Object.values(batches).flat();
  } else {
    filesToProcess = batches.pilot;
  }

  // Display header
  console.log('\n' + '='.repeat(70));
  console.log('         ValidationResult Type Consolidation');
  console.log('='.repeat(70));
  console.log(`\nBatch: ${batchName}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (preview only)' : 'EXECUTE (will modify files)'}`);
  console.log(`Files: ${filesToProcess.length}`);
  console.log('');

  // Process files
  const results = processBatch(filesToProcess, dryRun);

  // Display results
  console.log('\n' + '='.repeat(70));
  console.log('                          RESULTS');
  console.log('='.repeat(70));
  console.log(`\nModified: ${results.modified.length}`);
  console.log(`Skipped:  ${results.skipped.length}`);
  console.log(`Errors:   ${results.errors.length}`);

  if (results.skipped.length > 0 && !dryRun) {
    console.log('\nSkipped files:');
    results.skipped.forEach(({ file, reason }) => {
      console.log(`  - ${path.basename(file)}: ${reason}`);
    });
  }

  if (results.errors.length > 0) {
    console.log('\n✗ ERRORS:');
    results.errors.forEach(({ file, error }) => {
      console.log(`  - ${file}: ${error}`);
    });
  }

  // Display next steps
  if (dryRun) {
    console.log('\n' + '='.repeat(70));
    console.log('                       NEXT STEPS');
    console.log('='.repeat(70));
    console.log('\nTo apply changes:');
    console.log(`  node scripts/consolidate-validation-result-simple.js --batch=${batchName} --execute`);
    console.log('\nOr process all batches:');
    console.log('  node scripts/consolidate-validation-result-simple.js --all --execute');
  } else {
    console.log('\n' + '='.repeat(70));
    console.log('                         COMPLETE');
    console.log('='.repeat(70));
    console.log(`\n✓ ${results.modified.length} files modified successfully`);
    console.log('\nRun TypeScript compiler to verify:');
    console.log('  npx tsc --noEmit');
  }

  console.log('\n');
}

if (require.main === module) {
  main();
}

module.exports = { consolidateFile, processBatch };
