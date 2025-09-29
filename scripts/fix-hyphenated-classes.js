#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files with hyphenated class names that need fixing
const filesToFix = [
  'src/config/environment-overridesFacade.ts',
  'src/domains/deployment-orchestration/engines/blue-green-engine-fsm/blue-green-engineFacade.ts',
  'src/domains/deployment-orchestration/engines/blue-green-engine-fsm/blue-green-engineStateMachine.ts',
  'src/domains/deployment-orchestration/engines/blue-green-engine-fsm/blue-green-engineTypes.ts',
  'src/domains/deployment-orchestration/pipelines/pipeline-orchestrator-fsm/pipeline-orchestratorFacade.ts',
  'src/domains/deployment-orchestration/pipelines/pipeline-orchestrator-fsm/pipeline-orchestratorStateMachine.ts',
  'src/domains/deployment-orchestration/pipelines/pipeline-orchestrator-fsm/pipeline-orchestratorTypes.ts',
  'src/domains/ec/correlation/compliance-correlatorFacade.ts',
  'src/domains/ec/frameworks/nist-ssdf-validatorFacade.ts',
  'src/domains/ec/monitoring/real-time-monitorFacade.ts',
  'src/domains/ec/remediation/remediation-orchestratorFacade.ts',
  'src/fsm/orchestration/StateEventDispatcher-FSM.ts',
  'src/linter-integration/result-correlation-framework-fsm/result-correlation-frameworkFacade.ts',
  'src/linter-integration/result-correlation-framework-fsm/result-correlation-frameworkStateMachine.ts',
  'src/linter-integration/result-correlation-framework-fsm/result-correlation-frameworkTypes.ts',
  'src/orchestration/quality/EventBus-FSM.ts',
  'src/types/swarm-types-fsm/swarm-typesFacade.ts',
  'src/types/swarm-types-fsm/swarm-typesStateMachine.ts',
  'src/types/swarm-types-fsm/swarm-typesTypes.ts'
];

// Mapping of hyphenated names to CamelCase
const replacements = {
  'environment-overridesFacade': 'EnvironmentOverridesFacade',
  'blue-green-engineFacade': 'BlueGreenEngineFacade',
  'blue-green-engineStateMachine': 'BlueGreenEngineStateMachine',
  'blue-green-engineCore': 'BlueGreenEngineCore',
  'blue-green-engineTypes': 'BlueGreenEngineTypes',
  'blue-green-engineState': 'BlueGreenEngineState',
  'blue-green-engineEvents': 'BlueGreenEngineEvents',
  'pipeline-orchestratorFacade': 'PipelineOrchestratorFacade',
  'pipeline-orchestratorStateMachine': 'PipelineOrchestratorStateMachine',
  'pipeline-orchestratorTypes': 'PipelineOrchestratorTypes',
  'pipeline-orchestratorCore': 'PipelineOrchestratorCore',
  'pipeline-orchestratorState': 'PipelineOrchestratorState',
  'pipeline-orchestratorEvents': 'PipelineOrchestratorEvents',
  'compliance-correlatorFacade': 'ComplianceCorrelatorFacade',
  'nist-ssdf-validatorFacade': 'NistSsdfValidatorFacade',
  'real-time-monitorFacade': 'RealTimeMonitorFacade',
  'remediation-orchestratorFacade': 'RemediationOrchestratorFacade',
  'StateEventDispatcher-FSM': 'StateEventDispatcherFSM',
  'result-correlation-frameworkFacade': 'ResultCorrelationFrameworkFacade',
  'result-correlation-frameworkStateMachine': 'ResultCorrelationFrameworkStateMachine',
  'result-correlation-frameworkTypes': 'ResultCorrelationFrameworkTypes',
  'result-correlation-frameworkCore': 'ResultCorrelationFrameworkCore',
  'result-correlation-frameworkState': 'ResultCorrelationFrameworkState',
  'result-correlation-frameworkEvents': 'ResultCorrelationFrameworkEvents',
  'EventBus-FSM': 'EventBusFSM',
  'swarm-typesFacade': 'SwarmTypesFacade',
  'swarm-typesStateMachine': 'SwarmTypesStateMachine',
  'swarm-typesTypes': 'SwarmTypesTypes',
  'swarm-typesCore': 'SwarmTypesCore',
  'swarm-typesState': 'SwarmTypesState',
  'swarm-typesEvents': 'SwarmTypesEvents',
  'SwarmTypesEvents': 'SwarmTypesEvents', // Already fixed
  'SwarmTypesState': 'SwarmTypesState', // Already fixed
  'SwarmTypesStateMachine': 'SwarmTypesStateMachine', // Already fixed
  'SwarmTypesConfig': 'SwarmTypesConfig' // Already fixed
};

console.log('🔧 Fixing hyphenated class names in TypeScript files...\n');

let totalFixed = 0;
let totalErrors = 0;

for (const file of filesToFix) {
  const filePath = path.join(process.cwd(), file);

  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${file}`);
      continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let changesCount = 0;

    // Apply all replacements
    for (const [hyphenated, camelCase] of Object.entries(replacements)) {
      // Match class declarations, interface declarations, type declarations, imports, etc.
      const patterns = [
        new RegExp(`\\bclass\\s+${hyphenated}\\b`, 'g'),
        new RegExp(`\\binterface\\s+${hyphenated}\\b`, 'g'),
        new RegExp(`\\btype\\s+${hyphenated}\\b`, 'g'),
        new RegExp(`\\benum\\s+${hyphenated}\\b`, 'g'),
        new RegExp(`\\bexport\\s+class\\s+${hyphenated}\\b`, 'g'),
        new RegExp(`\\bexport\\s+interface\\s+${hyphenated}\\b`, 'g'),
        new RegExp(`\\bexport\\s+enum\\s+${hyphenated}\\b`, 'g'),
        new RegExp(`\\bnew\\s+${hyphenated}\\b`, 'g'),
        new RegExp(`\\b${hyphenated}\\s*\\{`, 'g'),
        new RegExp(`\\b${hyphenated}\\.`, 'g'),
        new RegExp(`:\\s*${hyphenated}\\b`, 'g'),
        new RegExp(`\\bimport\\s+\\{[^}]*${hyphenated}`, 'g'),
        new RegExp(`\\bfrom\\s+['"]\\.\\/${hyphenated}['"]`, 'g')
      ];

      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          changesCount += matches.length;
          content = content.replace(pattern, (match) => {
            return match.replace(hyphenated, camelCase);
          });
        }
      }
    }

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${file} (${changesCount} changes)`);
      totalFixed++;
    } else {
      console.log(`⏭️  No changes needed: ${file}`);
    }

  } catch (error) {
    console.error(`❌ Error fixing ${file}: ${error.message}`);
    totalErrors++;
  }
}

console.log('\n📊 Summary:');
console.log(`   Fixed: ${totalFixed} files`);
console.log(`   Errors: ${totalErrors} files`);
console.log(`   Total: ${filesToFix.length} files processed`);

process.exit(totalErrors > 0 ? 1 : 0);