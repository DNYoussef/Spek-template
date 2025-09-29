#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with HTML comment footers that need fixing
const filesToFix = [
  'src/architecture/langgraph/queen/components/PrincessDispatcher.ts',
  'src/architecture/langgraph/queen/components/QueenCommandProcessor.ts',
  'src/architecture/langgraph/queen/components/QueenMetricsAggregator.ts',
  'src/architecture/langgraph/queen/core/QueenCoordinator.ts',
  'src/architecture/langgraph/queen/engines/QueenDecisionEngine.ts',
  'src/architecture/langgraph/queen/managers/ExecutionManager.ts',
  'src/architecture/langgraph/queen/managers/ObjectiveManager.ts',
  'src/architecture/langgraph/queen/managers/ResourceManager.ts',
  'src/architecture/langgraph/queen/QueenFacade.ts',
  'src/architecture/langgraph/queen/types/QueenFSMTypes.ts',
  'src/architecture/langgraph/queen/types/QueenTypes.ts',
  'src/architecture/langgraph/queen/utils/NASACompliantLoopHandler.ts',
  'src/architecture/langgraph/state-machines/InfrastructureStateMachine.ts',
  'src/architecture/langgraph/state-machines/PrincessStateMachine.ts',
  'src/architecture/langgraph/state-machines/ResearchStateMachine.ts',
  'src/architecture/langgraph/StateGraph.ts',
  'src/architecture/langgraph/StateStore.ts',
  'src/architecture/langgraph/testing/fsm/StateGuards.ts',
  'src/architecture/langgraph/testing/PerformanceBenchmarks.ts',
  'src/architecture/langgraph/testing/TestRunner.ts',
  'src/architecture/langgraph/types/workflow.types.ts',
  'src/architecture/langgraph/workflows/orchestration/WorkflowExecutor.ts',
  'src/architecture/langgraph/workflows/orchestration/WorkflowValidator.ts',
  'src/architecture/langgraph/workflows/WorkflowOrchestrator.ts'
];

console.log(`Fixing ${filesToFix.length} TypeScript files with HTML comment footers...`);

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

    // Remove HTML comment footers and convert to TypeScript comments
    content = content.replace(/<!--\s*AGENT FOOTER BEGIN.*?-->/gs, '// === AGENT FOOTER ===');
    content = content.replace(/<!--\s*AGENT FOOTER END.*?-->/gs, '// === END FOOTER ===');

    // Fix malformed HTML comments in TypeScript context
    content = content.replace(/<\\!--/g, '//');
    content = content.replace(/-->/g, '');

    // Convert markdown tables in comments to simple comments
    content = content.replace(/^## Version & Run Log$/gm, '// Version & Run Log');
    content = content.replace(/^\| Version.*$/gm, '// Version History');
    content = content.replace(/^\|[-:| ]+\|$/gm, '');
    content = content.replace(/^\| (\d+\.\d+\.\d+).*$/gm, '// Version: $1');

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