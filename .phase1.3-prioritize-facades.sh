#!/bin/bash
# Phase 1.3: Prioritize Missing Facades by Import Frequency
# Ranks facades by how many files import them (highest impact first)

echo "=== Phase 1.3: Facade Prioritization ==="
echo ""

declare -A facade_counts

# List of missing facades (from scan results)
missing_facades=(
  "GitHubProjectIntegrationFSMFacade"
  "IntelligentContextPrunerFacade"
  "CrossReferenceManagerFacade"
  "DocumentationStoreFacade"
  "InfrastructureDocumentationManagerFacade"
  "ResearchDocumentationManagerFacade"
  "deployment-complianceFacade"
  "deployment-configFacade"
  "deployment-agent-realFacade"
  "blue-green-engineCoreFacade"
  "pipeline-orchestratorCoreFacade"
  "workflow-optimizer-realFacade"
  "ArtifactSystemIntegrationFSMFacade"
  "PerformanceOverheadValidatorCoreFacade"
  "EventAggregatorFacade"
  "EventLoggerFacade"
  "EventValidatorFacade"
  "EventFSMFacade"
  "FSMOrchestratorFacade"
  "StateTransitionMonitorFacade"
  "StateHistoryManagerFacade"
  "QualityPrincessStateMachineFacade"
  "SecurityMonitoringServiceFacade"
  "SecurityRemediationServiceFacade"
  "SecurityValidationServiceFacade"
  "GitHubGraphQLClientFacade"
  "GitHubPRManagerFacade"
  "GitHubWorkflowManagerFacade"
  "IssueIntelligenceFacade"
  "SecurityPolicyAutomationFacade"
  "RealWebhookEventProcessorFacade"
  "RealActionWorkflowBuilderFacade"
  "serverFacade"
  "GraphStateMapperFacade"
  "LangGraphAdapterFacade"
  "IntegrationApiFacadeFacade"
  "real-time-ingestion-engineFacade"
  "result-correlation-frameworkCoreFacade"
  "tool-management-systemFacade"
  "ResearchMemoryAdapterFacade"
  "MemoryUsageAnalyzerFacade"
  "CrossPrincessMemoryCoordinatorFacade"
  "MemoryOptimizerFacade"
  "MemoryEncryptionFacade"
  "AlertManagerFacade"
  "ProtocolFactoryFacade"
  "MigrationOrchestratorFSMFacade"
  "MigrationPlannerCoreFacade"
  "ProtocolVersionManagerCoreFacade"
  "RealProtocolMigratorFacade"
  "FailedStateFacade"
  "ImpactAnalysisCoreFacade"
  "MigrationAnalysisFacadeFacade"
  "AnalysisStateMachine.originalFacade"
  "ReportGeneratorCoreFacade"
  "RiskAssessmentAnalyzerFacade"
  "RiskAssessmentCalculatorFacade"
  "RiskAssessmentCoreFacade"
  "RiskAssessmentErrorHandlerFacade"
  "RiskAssessmentFacadeFacade"
  "RiskAssessmentValidatorFacade"
  "ImplementationPlanningStateFacade"
  "MigrationPlannerFacade"
  "MigrationPlannerFSMFacade"
  "BlueGreenProtocolMigrationFacade"
  "MigrationTestSuiteFacade"
  "MessageFormatConverterFacade"
  "ProtocolCoreFacade"
  "AgentMonitorFacade"
  "CoordinationHubFacade"
  "WorkflowExecutorFacade"
  "PreDeploymentValidatorFacade"
  "DependencyResolverFacade"
  "CompilationErrorResolverFacade"
  "QualityGateTypesFacade"
  "QualityGateContainerFacade"
  "ErrorHandlingSystemFacade"
  "QualityGateMonitorFacade"
  "QualityGateStateMachineFacade"
  "QualityGateReporterFacade"
  "QualityGateValidatorFacade"
  "PerformanceAnalyzerFacade"
  "CICDPerformanceBenchmarkerFacade"
  "AdaptivePerformanceOptimizerFacade"
  "BenchmarkCLIFacade"
  "PerformanceTheaterDetectorFacade"
  "CPUProfilerCoreFacade"
  "LoadTesterFacade"
  "LoadGeneratorFacade"
  "MemoryProfilerFacade"
  "LatencyAnalyzerFacade"
  "ReportGeneratorFacade"
  "CrossPlatformTestRunnerFacade"
  "PerformanceBenchmarkerFacade"
)

echo "Counting import frequency for ${#missing_facades[@]} missing facades..."
echo ""

for facade in "${missing_facades[@]}"; do
  count=$(grep -r "import.*from.*$facade" src/ --include="*.ts" 2>/dev/null | wc -l)
  if [ $count -gt 0 ]; then
    facade_counts["$facade"]=$count
  fi
done

echo "=== TOP 20 HIGHEST IMPACT FACADES ==="
echo "Rank | Imports | Facade Name"
echo "-----|---------|------------"

rank=1
for facade in "${!facade_counts[@]}"; do
  echo "${facade_counts[$facade]} $facade"
done | sort -rn | head -20 | while read count name; do
  printf "%4d | %7d | %s\n" $rank $count "$name"
  rank=$((rank + 1))
done

echo ""
echo "=== BATCH 1 RECOMMENDATION (Top 10) ==="
for facade in "${!facade_counts[@]}"; do
  echo "${facade_counts[$facade]} $facade"
done | sort -rn | head -10 | while read count name; do
  echo "  - $name (fixes $count imports)"
done

echo ""
echo "=== NEXT STEP ==="
echo "Run: .phase1.3-generate-facades.sh <batch_number>"
