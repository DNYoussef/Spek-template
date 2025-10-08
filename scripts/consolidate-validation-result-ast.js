#!/usr/bin/env node
/**
 * ValidationResult Type Consolidation Script
 * Uses TypeScript Compiler API for safe AST-based replacement
 *
 * Purpose: Replace duplicate ValidationResult interface definitions
 *          with import from canonical source (~/types/validation-types)
 *
 * Safety: Dry-run mode by default, shows diff before applying
 */

const ts = require('typescript');
const fs = require('fs');
const path = require('path');

// Configuration
const CANONICAL_IMPORT = "import { ValidationResult } from '~/types/validation-types';";
const CANONICAL_FILE = 'src/types/validation-types.ts';

/**
 * Parse TypeScript file and extract ValidationResult interface
 */
function findValidationResultInterface(sourceFile) {
  let validationResultNode = null;
  let hasExistingImport = false;

  function visit(node) {
    // Check for existing import from canonical
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier.getText(sourceFile);
      if (moduleSpecifier.includes('validation-types')) {
        hasExistingImport = true;
      }
    }

    // Check for ValidationResult interface
    if (ts.isInterfaceDeclaration(node)) {
      const interfaceName = node.name.getText(sourceFile);
      if (interfaceName === 'ValidationResult') {
        const hasExport = node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
        if (hasExport) {
          validationResultNode = node;
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return { validationResultNode, hasExistingImport };
}

/**
 * Remove ValidationResult interface and add import
 */
function consolidateValidationResult(filePath, dryRun = true) {
  // Skip canonical file
  if (filePath.includes(CANONICAL_FILE)) {
    return { skipped: true, reason: 'Canonical file' };
  }

  // Read file
  const content = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );

  const { validationResultNode, hasExistingImport } = findValidationResultInterface(sourceFile);

  // Skip if no ValidationResult found
  if (!validationResultNode) {
    return { skipped: true, reason: 'No ValidationResult interface found' };
  }

  // Skip if already has import
  if (hasExistingImport) {
    return { skipped: true, reason: 'Already has canonical import' };
  }

  // Get position of interface to remove
  const interfaceStart = validationResultNode.getStart(sourceFile);
  const interfaceEnd = validationResultNode.getEnd();

  // Find where to insert import (after existing imports or at top)
  let importInsertPosition = 0;
  let lastImportEnd = 0;

  function findImportPosition(node) {
    if (ts.isImportDeclaration(node)) {
      lastImportEnd = node.getEnd();
    }
    ts.forEachChild(node, findImportPosition);
  }

  findImportPosition(sourceFile);

  if (lastImportEnd > 0) {
    // Insert after last import
    importInsertPosition = lastImportEnd;
  } else {
    // Insert at top (after any leading comments)
    const firstStatement = sourceFile.statements[0];
    if (firstStatement) {
      importInsertPosition = firstStatement.getStart(sourceFile, false);
    }
  }

  // Build new content
  const beforeInterface = content.slice(0, interfaceStart);
  const afterInterface = content.slice(interfaceEnd);

  // Remove interface and any trailing newlines
  const beforeImport = content.slice(0, importInsertPosition);
  const afterImport = content.slice(importInsertPosition);

  // Find if there's a newline after the interface
  let newlineAfterInterface = '';
  const nextChar = afterInterface[0];
  if (nextChar === '\n' || nextChar === '\r') {
    const match = afterInterface.match(/^[\r\n]+/);
    if (match) {
      newlineAfterInterface = match[0];
    }
  }

  // Construct new content
  let newContent;

  if (importInsertPosition === 0) {
    // Insert at top
    newContent =
      CANONICAL_IMPORT + '\n\n' +
      beforeInterface +
      afterInterface.replace(/^[\r\n]+/, ''); // Remove extra newlines after removed interface
  } else {
    // Insert after last import
    newContent =
      beforeImport + '\n' +
      CANONICAL_IMPORT +
      (lastImportEnd === interfaceStart ? '' : '\n') +
      (lastImportEnd === interfaceStart ? afterInterface : content.slice(importInsertPosition, interfaceStart) + afterInterface);
  }

  // Simplified: Remove interface, add import at proper location
  const lines = content.split('\n');
  const interfaceLineStart = content.slice(0, interfaceStart).split('\n').length - 1;
  const interfaceLineEnd = content.slice(0, interfaceEnd).split('\n').length - 1;

  // Remove interface lines
  lines.splice(interfaceLineStart, interfaceLineEnd - interfaceLineStart + 1);

  // Find import insertion line
  const importInsertLine = content.slice(0, importInsertPosition).split('\n').length - 1;

  // Insert import
  if (lastImportEnd > 0) {
    lines.splice(importInsertLine + 1, 0, CANONICAL_IMPORT);
  } else {
    lines.splice(0, 0, CANONICAL_IMPORT, '');
  }

  newContent = lines.join('\n');

  // Show diff if dry run
  if (dryRun) {
    console.log(`\n=== ${filePath} ===`);
    console.log('REMOVED:');
    console.log(content.slice(interfaceStart, interfaceEnd).split('\n').map(l => `  - ${l}`).join('\n'));
    console.log('\nADDED:');
    console.log(`  + ${CANONICAL_IMPORT}`);
    console.log('\nPosition: Line ' + (interfaceLineStart + 1) + '-' + (interfaceLineEnd + 1));
    return { modified: true, dryRun: true };
  }

  // Write file
  fs.writeFileSync(filePath, newContent, 'utf-8');
  return { modified: true, dryRun: false };
}

/**
 * Process files from list
 */
function processFiles(files, dryRun = true) {
  const results = {
    modified: [],
    skipped: [],
    errors: []
  };

  for (const file of files) {
    try {
      const result = consolidateValidationResult(file, dryRun);

      if (result.skipped) {
        results.skipped.push({ file, reason: result.reason });
      } else if (result.modified) {
        results.modified.push(file);
      }
    } catch (error) {
      results.errors.push({ file, error: error.message });
    }
  }

  return results;
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');

  // File list from Batch 1C (pilot files)
  const pilotFiles = [
    'src/types/DatasetTypes.ts',
    'src/types/DegradationTypes.ts',
    'src/types/base/common.ts',
    'src/types/base/shared.ts',
    'src/context/degradation/types/DegradationTypes.ts'
  ];

  // All files (from grep analysis)
  const allFiles = [
    'src/workflow/core/WorkflowValidator.ts',
    'src/workflow/core/StepExecutor.ts',
    'src/validation/stages/ValidationEngine.ts',
    'src/validation/fsm/types/ValidationFSMTypes.ts',
    'src/validation/context/SchemaValidator.ts',
    'src/config/types/ConfigTypes.ts',
    'src/architecture/langgraph/workflows/validation/WorkflowValidator.ts',
    'src/architecture/langgraph/workflows/orchestration/WorkflowValidatorFacade.ts',
    'src/architecture/langgraph/workflows/orchestration/WorkflowTypes.ts',
    'src/utilities/validation/index.ts',
    'src/architecture/langgraph/testing/ValidationSuite.ts',
    'src/architecture/langgraph/testing/types/ValidationFSM.types.ts',
    'src/compliance/monitoring/ComplianceDriftDetector-typed.ts',
    'src/analysis/core/types/AnalysisTypes.ts',
    'src/types/DegradationTypes.ts',
    'src/types/DatasetTypes.ts',
    'src/types/base/shared.ts',
    'src/types/base/common.ts',
    'src/swarm/testing/SandboxTestingFramework.ts',
    'src/dspy-integration/types/DSPyTypes.ts',
    'src/dspy-integration/types/dspy-integration.types.ts',
    'src/dspy-integration/types/DatasetTypes.ts',
    'src/dspy-integration/core/SignatureValidator.ts',
    'src/dspy-integration/signatures/PrincessDroneSignatures.ts',
    'src/dspy-integration/claude-md/SystemWideValidator.ts',
    'src/context/ContextDNA.ts',
    'src/dspy-integration/batch/OptimizationValidator.ts',
    'src/shared/mega-fsm/types/MegaDecompositionTypes.ts',
    'src/dspy-integration/a2a-context-dna/interfaces/types.ts',
    'src/domains/quality-gates/integrations/ArtifactSystemIntegration.ts',
    'src/fsm/orchestration/ValidationStates.ts',
    'src/fsm/orchestration/StateGuardValidator.ts',
    'src/integrations/ArtifactSystemIntegration.ts',
    'src/routing/components/RoutingValidationEngine.ts',
    'src/events/fsm/types/EventFSMTypes.ts',
    'src/protocols/docs/fsm/DocGeneratorTypes.ts',
    'src/orchestration/quality/interfaces/IQualityGateRegistry.ts',
    'src/orchestration/phases/phase-transition/PhaseTransitionTypesFacade.ts',
    'src/orchestration/integration/unified/IntegrationFSMCore.ts',
    'src/orchestration/integration/fsm/types/IntegrationFSMTypes.ts',
    'src/orchestration/integration/dependency/DependencyTypes.ts',
    'src/orchestration/deployment/readiness/types/ReadinessTypes.ts',
    'src/migration/translation/protocol-components/ProtocolTranslatorTypes.ts',
    'src/migration/translation/fsm/MessageFormatTypes.ts',
    'src/migration/strategies/canary/handlers/CanaryValidationHandler.ts',
    'src/migration/planning/risk/reporting/types/ReportingTypes.ts'
  ];

  const filesToProcess = args.includes('--all') ? allFiles : pilotFiles;

  console.log('=== ValidationResult Type Consolidation ===');
  console.log(`Mode: ${dryRun ? 'DRY RUN (preview only)' : 'EXECUTE (will modify files)'}`);
  console.log(`Files to process: ${filesToProcess.length}`);
  console.log('');

  const results = processFiles(filesToProcess, dryRun);

  console.log('\n=== RESULTS ===');
  console.log(`Modified: ${results.modified.length}`);
  console.log(`Skipped: ${results.skipped.length}`);
  console.log(`Errors: ${results.errors.length}`);

  if (results.skipped.length > 0) {
    console.log('\nSkipped files:');
    results.skipped.forEach(({ file, reason }) => {
      console.log(`  - ${file}: ${reason}`);
    });
  }

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(({ file, error }) => {
      console.log(`  - ${file}: ${error}`);
    });
  }

  if (dryRun) {
    console.log('\n=== TO APPLY CHANGES ===');
    console.log('Run with --execute flag:');
    console.log('  node scripts/consolidate-validation-result-ast.js --execute');
    console.log('\nOr process all files:');
    console.log('  node scripts/consolidate-validation-result-ast.js --all --execute');
  } else {
    console.log('\n=== CHANGES APPLIED ===');
    console.log(`${results.modified.length} files modified`);
    console.log('\nRun TypeScript compiler to verify:');
    console.log('  npx tsc --noEmit');
  }
}

if (require.main === module) {
  main();
}

module.exports = { consolidateValidationResult, processFiles };
