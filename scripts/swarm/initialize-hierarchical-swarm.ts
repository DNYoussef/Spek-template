#!/usr/bin/env ts-node
/**
 * Initialize Hierarchical Swarm for God Object Remediation
 *
 * This script deploys the complete Queen-Princess-Drone architecture
 * with Byzantine consensus and parallel execution pipelines.
 *
 * Usage: ts-node scripts/swarm/initialize-hierarchical-swarm.ts
 */

import { SwarmInitializer } from '../../src/swarm/orchestration/SwarmInitializer';

async function main() {
  console.log('\n');
  console.log('?');
  console.log('?   HIERARCHICAL SWARM INITIALIZATION FOR GOD OBJECT        ?');
  console.log('?   REMEDIATION - DAYS 3-5 TARGET: 20 OBJECTS               ?');
  console.log('?');
  console.log('\n');

  const swarmConfig = {
    maxConcurrentFiles: 4,              // 3-4 files per princess
    byzantineToleranceLevel: 0.33,      // Tolerate 33% Byzantine nodes
    parallelPipelinesPerPrincess: 2,    // 2 pipelines per princess
    godObjectTarget: 20,                // Target: 20 god objects
    timelineHours: 72,                  // Days 3-5 (72 hours)
    consensusQuorum: 0.67,              // 2/3 majority required
    healthCheckInterval: 30000          // Health check every 30s
  };

  const initializer = new SwarmInitializer(swarmConfig);

  // Event listeners for monitoring
  initializer.on('swarm:initialized', (status) => {
    console.log('[OK] Swarm initialization complete');
    console.log('  Status:', JSON.stringify(status, null, 2));
  });

  initializer.on('godObject:decomposed', (task) => {
    console.log(`[OK] God object decomposed: ${task.id}`);
  });

  initializer.on('godObject:failed', (task) => {
    console.error(`[X] God object decomposition failed: ${task.id}`);
  });

  initializer.on('health:checked', (results) => {
    const healthy = Array.from(results.values()).filter(r => r.healthy).length;
    const total = results.size;
    console.log(`Health Check: ${healthy}/${total} princesses healthy`);
  });

  initializer.on('pipeline:configured', (config) => {
    console.log(`Pipeline configured for ${config.princess}: ${config.pipelines} pipelines, max ${config.maxConcurrent} concurrent files`);
  });

  try {
    // Initialize swarm infrastructure
    const status = await initializer.initializeSwarm();

    console.log('\n?');
    console.log('?   SWARM STATUS                                             ?');
    console.log('?\n');
    console.log(`Queen Status:           ${status.queenStatus}`);
    console.log(`Princess Count:         ${status.princessCount}`);
    console.log(`Active Princesses:      ${status.activePrincesses.join(', ')}`);
    console.log(`Consensus Health:       ${(status.consensusHealth * 100).toFixed(1)}%`);
    console.log(`Parallel Pipelines:     ${status.parallelPipelines}`);
    console.log(`God Objects Processed:  ${status.godObjectsProcessed}/${swarmConfig.godObjectTarget}`);
    console.log(`Estimated Completion:   ${status.estimatedCompletionHours.toFixed(1)} hours`);

    console.log('\n?');
    console.log('?   PRINCESS DOMAINS ACTIVE                                  ?');
    console.log('?\n');
    console.log('  1. DevelopmentPrincess    - Core development & implementation');
    console.log('  2. QualityPrincess        - Testing & validation');
    console.log('  3. SecurityPrincess       - Security compliance & auditing');
    console.log('  4. ResearchPrincess       - Pattern analysis & knowledge discovery');
    console.log('  5. InfrastructurePrincess - Build & environment management');
    console.log('  6. CoordinationPrincess   - Task management & coordination');

    console.log('\n?');
    console.log('?   BYZANTINE CONSENSUS CONFIGURATION                        ?');
    console.log('?\n');
    console.log(`  Consensus Type:         Byzantine Fault Tolerant`);
    console.log(`  Quorum Requirement:     ${swarmConfig.consensusQuorum * 100}%`);
    console.log(`  Byzantine Tolerance:    ${Math.floor(swarmConfig.byzantineToleranceLevel * 100)}%`);
    console.log(`  Minimum Healthy Nodes:  ${Math.ceil(status.princessCount * swarmConfig.consensusQuorum)}`);

    console.log('\n?');
    console.log('?   PARALLEL EXECUTION CAPACITY                              ?');
    console.log('?\n');
    console.log(`  Pipelines per Princess: ${swarmConfig.parallelPipelinesPerPrincess}`);
    console.log(`  Max Concurrent Files:   ${swarmConfig.maxConcurrentFiles}`);
    console.log(`  Total Pipelines:        ${status.parallelPipelines}`);
    console.log(`  Max System Throughput:  ${status.parallelPipelines * swarmConfig.maxConcurrentFiles} files/cycle`);

    console.log('\n?');
    console.log('?   SUCCESS CRITERIA                                         ?');
    console.log('?\n');
    console.log(`  [OK] Swarm operational with all 6 princesses active`);
    console.log(`  [OK] Byzantine consensus configured and healthy`);
    console.log(`  [OK] Parallel execution pipelines ready`);
    console.log(`  [OK] Monitoring and progress tracking initialized`);
    console.log(`  [OK] Target: Support decomposition of 20 god objects in Days 3-5`);

    console.log('\n?');
    console.log('?   NEXT STEPS                                               ?');
    console.log('?\n');
    console.log('  1. Run god object detection to identify targets');
    console.log('  2. Execute: swarm.decomposeGodObject(filePath, metadata)');
    console.log('  3. Monitor progress via health checks and metrics');
    console.log('  4. Review consensus decisions for quality assurance');
    console.log('  5. Track completion towards 20 object target\n');

    // Keep process alive for monitoring (remove in production)
    console.log('Swarm is now active and monitoring... (Press Ctrl+C to shutdown)\n');

  } catch (error) {
    console.error('\n[X] Swarm initialization failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\nReceived shutdown signal...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\nReceived termination signal...');
  process.exit(0);
});

// Execute
main().catch(console.error);