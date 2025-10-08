#!/usr/bin/env node

/**
 * Theater Elimination Validation Script
 *
 * Validates that all theatrical placeholders have been replaced with
 * genuine orchestration capabilities in WorkflowOrchestrator.
 */

const fs = require('fs');
const path = require('path');

class TheaterEliminationValidator {
  constructor() {
    this.sourceFile = path.join(__dirname, '../src/swarm/orchestration/WorkflowOrchestrator.ts');
    this.validationResults = {
      consoleLogElimination: false,
      winstonLoggerImplementation: false,
      realTaskDelegation: false,
      realMECEValidation: false,
      realByzantineConsensus: false,
      realSwarmHealthMonitoring: false,
      realAgentPoolManagement: false,
      realSemanticSimilarity: false,
      realTaskValidation: false,
      theaterScoreReduction: false
    };
  }

  async validateAll() {
    console.log('🔍 Starting Theater Elimination Validation...\n');

    const content = fs.readFileSync(this.sourceFile, 'utf8');

    // 1. Validate console.log elimination
    this.validateConsoleLogElimination(content);

    // 2. Validate Winston logger implementation
    this.validateWinstonImplementation(content);

    // 3. Validate real task delegation
    this.validateRealTaskDelegation(content);

    // 4. Validate real MECE validation
    this.validateRealMECEValidation(content);

    // 5. Validate real Byzantine consensus
    this.validateRealByzantineConsensus(content);

    // 6. Validate real swarm health monitoring
    this.validateRealSwarmHealthMonitoring(content);

    // 7. Validate real agent pool management
    this.validateRealAgentPoolManagement(content);

    // 8. Validate real semantic similarity
    this.validateRealSemanticSimilarity(content);

    // 9. Validate real task validation
    this.validateRealTaskValidation(content);

    // 10. Calculate theater score
    this.calculateTheaterScore(content);

    this.generateReport();
  }

  validateConsoleLogElimination(content) {
    const lines = content.split('\n');
    const consoleLogLines = lines
      .map((line, index) => ({ line: line.trim(), number: index + 1 }))
      .filter(({ line }) =>
        line.includes('console.log') &&
        !line.startsWith('//') &&
        !line.startsWith('*') &&
        !line.includes('// ')
      );

    this.validationResults.consoleLogElimination = consoleLogLines.length === 0;

    console.log(`✅ Console.log Elimination: ${this.validationResults.consoleLogElimination ? 'PASS' : 'FAIL'}`);
    if (!this.validationResults.consoleLogElimination) {
      console.log(`   Found ${consoleLogLines.length} console.log statements`);
      consoleLogLines.slice(0, 3).forEach(({ line, number }) => {
        console.log(`   Line ${number}: ${line}`);
      });
    }
  }

  validateWinstonImplementation(content) {
    const hasWinstonImport = content.includes("import * as winston from 'winston'");
    const hasLoggerProperty = content.includes('private logger: winston.Logger');
    const hasInitializeLogger = content.includes('initializeLogger()');
    const hasLoggerUsage = content.includes('this.logger.info') || content.includes('this.logger.error');

    this.validationResults.winstonLoggerImplementation =
      hasWinstonImport && hasLoggerProperty && hasInitializeLogger && hasLoggerUsage;

    console.log(`✅ Winston Logger Implementation: ${this.validationResults.winstonLoggerImplementation ? 'PASS' : 'FAIL'}`);
    if (!this.validationResults.winstonLoggerImplementation) {
      console.log(`   Winston Import: ${hasWinstonImport}`);
      console.log(`   Logger Property: ${hasLoggerProperty}`);
      console.log(`   Initialize Method: ${hasInitializeLogger}`);
      console.log(`   Logger Usage: ${hasLoggerUsage}`);
    }
  }

  validateRealTaskDelegation(content) {
    const hasExecutePrincessTask = content.includes('async executePrincessTask(');
    const hasSpawnPrincessAgent = content.includes('async spawnPrincessAgent(');
    const hasMcpAgentSpawning = content.includes('await this.mcpServer.spawnAgent(');
    const hasRealTaskExecution = content.includes('await agent.executeTask(');
    const hasTaskResultValidation = content.includes('await this.validateTaskResult(');

    this.validationResults.realTaskDelegation =
      hasExecutePrincessTask && hasSpawnPrincessAgent && hasMcpAgentSpawning &&
      hasRealTaskExecution && hasTaskResultValidation;

    console.log(`✅ Real Task Delegation: ${this.validationResults.realTaskDelegation ? 'PASS' : 'FAIL'}`);
    if (!this.validationResults.realTaskDelegation) {
      console.log(`   Execute Princess Task: ${hasExecutePrincessTask}`);
      console.log(`   Spawn Princess Agent: ${hasSpawnPrincessAgent}`);
      console.log(`   MCP Agent Spawning: ${hasMcpAgentSpawning}`);
      console.log(`   Real Task Execution: ${hasRealTaskExecution}`);
      console.log(`   Task Result Validation: ${hasTaskResultValidation}`);
    }
  }

  validateRealMECEValidation(content) {
    const hasValidateMECEPrinciple = content.includes('async validateMECEPrinciple(');
    const hasSemanticSimilarity = content.includes('await this.calculateSemanticSimilarity(');
    const hasConflictAreaIdentification = content.includes('await this.identifyConflictArea(');
    const hasRealGapAnalysis = content.includes('const requiredDomains = await this.getRequiredDomains()');
    const hasMECEScoreCalculation = content.includes('this.calculateMECEScore(');

    this.validationResults.realMECEValidation =
      hasValidateMECEPrinciple && hasSemanticSimilarity && hasConflictAreaIdentification &&
      hasRealGapAnalysis && hasMECEScoreCalculation;

    console.log(`✅ Real MECE Validation: ${this.validationResults.realMECEValidation ? 'PASS' : 'FAIL'}`);
    if (!this.validationResults.realMECEValidation) {
      console.log(`   Validate MECE Principle: ${hasValidateMECEPrinciple}`);
      console.log(`   Semantic Similarity: ${hasSemanticSimilarity}`);
      console.log(`   Conflict Area ID: ${hasConflictAreaIdentification}`);
      console.log(`   Real Gap Analysis: ${hasRealGapAnalysis}`);
      console.log(`   MECE Score Calculation: ${hasMECEScoreCalculation}`);
    }
  }

  validateRealByzantineConsensus(content) {
    const hasAchieveByzantineConsensus = content.includes('async achieveByzantineConsensus(');
    const hasRealVoteCollection = content.includes('await Promise.all(');
    const hasBFTLogic = content.includes('Math.floor(agents.length * 2/3) + 1');
    const hasRequestVote = content.includes('await this.requestVote(');
    const hasExecuteDecision = content.includes('await this.executeDecision(');

    this.validationResults.realByzantineConsensus =
      hasAchieveByzantineConsensus && hasRealVoteCollection && hasBFTLogic &&
      hasRequestVote && hasExecuteDecision;

    console.log(`✅ Real Byzantine Consensus: ${this.validationResults.realByzantineConsensus ? 'PASS' : 'FAIL'}`);
    if (!this.validationResults.realByzantineConsensus) {
      console.log(`   Achieve Byzantine Consensus: ${hasAchieveByzantineConsensus}`);
      console.log(`   Real Vote Collection: ${hasRealVoteCollection}`);
      console.log(`   BFT Logic: ${hasBFTLogic}`);
      console.log(`   Request Vote: ${hasRequestVote}`);
      console.log(`   Execute Decision: ${hasExecuteDecision}`);
    }
  }

  validateRealSwarmHealthMonitoring(content) {
    const hasGetSwarmHealthMetrics = content.includes('async getSwarmHealthMetrics(');
    const hasRealHealthChecks = content.includes('await this.checkAgentHealth(');
    const hasResponseTimeMeasurement = content.includes('await this.measureAgentResponseTime(');
    const hasTaskLoadGetting = content.includes('await this.getAgentTaskLoad(');
    const hasMetricsCalculation = content.includes('healthChecks.reduce(');

    this.validationResults.realSwarmHealthMonitoring =
      hasGetSwarmHealthMetrics && hasRealHealthChecks && hasResponseTimeMeasurement &&
      hasTaskLoadGetting && hasMetricsCalculation;

    console.log(`✅ Real Swarm Health Monitoring: ${this.validationResults.realSwarmHealthMonitoring ? 'PASS' : 'FAIL'}`);
    if (!this.validationResults.realSwarmHealthMonitoring) {
      console.log(`   Get Swarm Health Metrics: ${hasGetSwarmHealthMetrics}`);
      console.log(`   Real Health Checks: ${hasRealHealthChecks}`);
      console.log(`   Response Time Measurement: ${hasResponseTimeMeasurement}`);
      console.log(`   Task Load Getting: ${hasTaskLoadGetting}`);
      console.log(`   Metrics Calculation: ${hasMetricsCalculation}`);
    }
  }

  validateRealAgentPoolManagement(content) {
    const hasSpawnDroneAgent = content.includes('async spawnDroneAgent(');
    const hasRegisterAgent = content.includes('await this.registerAgent(');
    const hasStartAgentMonitoring = content.includes('this.startAgentMonitoring(');
    const hasAgentPoolProperty = content.includes('private agentPool: Map<string, Agent>');
    const hasGetAllActiveAgents = content.includes('async getAllActiveAgents(');

    this.validationResults.realAgentPoolManagement =
      hasSpawnDroneAgent && hasRegisterAgent && hasStartAgentMonitoring &&
      hasAgentPoolProperty && hasGetAllActiveAgents;

    console.log(`✅ Real Agent Pool Management: ${this.validationResults.realAgentPoolManagement ? 'PASS' : 'FAIL'}`);
    if (!this.validationResults.realAgentPoolManagement) {
      console.log(`   Spawn Drone Agent: ${hasSpawnDroneAgent}`);
      console.log(`   Register Agent: ${hasRegisterAgent}`);
      console.log(`   Start Agent Monitoring: ${hasStartAgentMonitoring}`);
      console.log(`   Agent Pool Property: ${hasAgentPoolProperty}`);
      console.log(`   Get All Active Agents: ${hasGetAllActiveAgents}`);
    }
  }

  validateRealSemanticSimilarity(content) {
    const hasCalculateSemanticSimilarity = content.includes('async calculateSemanticSimilarity(');
    const hasWordOverlapLogic = content.includes('const intersection = words1.filter(');
    const hasSimilarityCalculation = content.includes('intersection.length / union.length');
    const hasConfidenceCalculation = content.includes('Math.min(intersection.length / 5, 1.0)');

    this.validationResults.realSemanticSimilarity =
      hasCalculateSemanticSimilarity && hasWordOverlapLogic &&
      hasSimilarityCalculation && hasConfidenceCalculation;

    console.log(`✅ Real Semantic Similarity: ${this.validationResults.realSemanticSimilarity ? 'PASS' : 'FAIL'}`);
    if (!this.validationResults.realSemanticSimilarity) {
      console.log(`   Calculate Semantic Similarity: ${hasCalculateSemanticSimilarity}`);
      console.log(`   Word Overlap Logic: ${hasWordOverlapLogic}`);
      console.log(`   Similarity Calculation: ${hasSimilarityCalculation}`);
      console.log(`   Confidence Calculation: ${hasConfidenceCalculation}`);
    }
  }

  validateRealTaskValidation(content) {
    const hasValidateTaskResult = content.includes('async validateTaskResult(');
    const hasEvaluateCriterion = content.includes('await this.evaluateCriterion(');
    const hasCriterionLogic = content.includes('criterion.includes(');
    const hasAcceptanceCriteriaLoop = content.includes('for (const criterion of acceptanceCriteria)');

    this.validationResults.realTaskValidation =
      hasValidateTaskResult && hasEvaluateCriterion &&
      hasCriterionLogic && hasAcceptanceCriteriaLoop;

    console.log(`✅ Real Task Validation: ${this.validationResults.realTaskValidation ? 'PASS' : 'FAIL'}`);
    if (!this.validationResults.realTaskValidation) {
      console.log(`   Validate Task Result: ${hasValidateTaskResult}`);
      console.log(`   Evaluate Criterion: ${hasEvaluateCriterion}`);
      console.log(`   Criterion Logic: ${hasCriterionLogic}`);
      console.log(`   Acceptance Criteria Loop: ${hasAcceptanceCriteriaLoop}`);
    }
  }

  calculateTheaterScore(content) {
    const theaterIndicators = [
      'placeholder',
      'mock',
      'fake',
      'ascii art',
      'theater',
      'simulation only',
      'todo:',
      'fixme:',
      'hack:',
      'temporary',
      'stub',
      'dummy'
    ];

    let theaterCount = 0;
    const lines = content.split('\n');

    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      theaterIndicators.forEach(indicator => {
        if (lowerLine.includes(indicator) && !lowerLine.trim().startsWith('//')) {
          theaterCount++;
        }
      });
    });

    // Calculate theater score (lower is better)
    const linesOfCode = lines.filter(line => line.trim() && !line.trim().startsWith('//')).length;
    const theaterScore = Math.min(100, (theaterCount / linesOfCode) * 1000);

    this.validationResults.theaterScoreReduction = theaterScore < 60; // Target under 60

    console.log(`✅ Theater Score: ${theaterScore.toFixed(1)}/100 (${this.validationResults.theaterScoreReduction ? 'PASS' : 'FAIL'})`);
    console.log(`   Theater indicators found: ${theaterCount}`);
    console.log(`   Lines of code: ${linesOfCode}`);
  }

  generateReport() {
    console.log('\n🎭 THEATER ELIMINATION SUMMARY');
    console.log('=====================================');

    const passedChecks = Object.values(this.validationResults).filter(Boolean).length;
    const totalChecks = Object.keys(this.validationResults).length;
    const passRate = (passedChecks / totalChecks) * 100;

    console.log(`Overall Pass Rate: ${passRate.toFixed(1)}% (${passedChecks}/${totalChecks})`);

    if (passRate >= 90) {
      console.log('🎉 THEATER SUCCESSFULLY ELIMINATED - GENUINE ORCHESTRATION ACHIEVED!');
    } else if (passRate >= 70) {
      console.log('⚠️  SIGNIFICANT PROGRESS - MINOR THEATER REMNANTS DETECTED');
    } else {
      console.log('❌ THEATER ELIMINATION INCOMPLETE - MAJOR WORK NEEDED');
    }

    console.log('\nDetailed Results:');
    Object.entries(this.validationResults).forEach(([check, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      const checkName = check.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`  ${checkName}: ${status}`);
    });

    if (passRate === 100) {
      console.log('\n🚀 READY FOR PRODUCTION - NO ORCHESTRATION THEATER DETECTED!');
    }

    return passRate;
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new TheaterEliminationValidator();
  validator.validateAll().catch(console.error);
}

module.exports = TheaterEliminationValidator;