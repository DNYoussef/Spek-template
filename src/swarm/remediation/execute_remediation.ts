#!/usr/bin/env node
/**
 * Execute Queen Remediation
 *
 * This script initiates the complete remediation of 95 god objects
 * and 35,973 connascence violations using the Queen-Princess-Subagent hierarchy
 */

import { QueenRemediationOrchestrator } from './QueenRemediationOrchestrator';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    console.log('========================================');
    console.log('INITIATING QUEEN REMEDIATION SYSTEM');
    console.log('========================================\n');

    // Initialize the Queen Orchestrator
    const queen = new QueenRemediationOrchestrator();

    // Get initial status
    const status = queen.getStatus();
    console.log('Initial Status:');
    console.log(`  Phase: ${status.phase}`);
    console.log(`  Domains: ${status.domains.join(', ')}`);
    console.log(`  Metrics:`);
    console.log(`    - God Objects: ${status.metrics.godObjectsTotal}`);
    console.log(`    - Connascence: ${status.metrics.connascenceTotal}`);
    console.log('\n');

    try {
        // Execute the complete remediation pipeline
        await queen.executeRemediation();

        // Get final status
        const finalStatus = queen.getStatus();
        console.log('\n\nFinal Status:');
        console.log(`  God Objects Fixed: ${finalStatus.metrics.godObjectsFixed}/${finalStatus.metrics.godObjectsTotal}`);
        console.log(`  Connascence Fixed: ${finalStatus.metrics.connascenceFixed}/${finalStatus.metrics.connascenceTotal}`);
        console.log(`  NASA Compliance: ${finalStatus.metrics.nasaCompliance}%`);
        console.log(`  Defense Compliance: ${finalStatus.metrics.defenseCompliance}%`);
        console.log(`  Performance Improvement: ${finalStatus.metrics.performanceImprovement}%`);

    } catch (error) {
        console.error('Remediation failed:', error);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    main().catch(console.error);
}

export { main as executeRemediation };