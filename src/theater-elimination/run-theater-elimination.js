#!/usr/bin/env node

/**
 * Theater Elimination Runner - Production Deployment Script
 * Execute complete theater elimination with evidence generation
 */

const ProductionValidationRunner = require('./production-validation-runner');
const path = require('path');

async function main() {
  const runner = new ProductionValidationRunner();

  console.log(' THEATER ELIMINATION SYSTEM');
  console.log('=============================');
  console.log('Initializing production validation runner...\n');

  try {
    // Define target files for elimination
    const targetFiles = [
      path.resolve(__dirname, 'real-swarm-orchestrator.js'),
      path.resolve(__dirname, 'authentic-princess-system.js'),
      path.resolve(__dirname, 'nine-stage-implementation.js'),
      path.resolve(__dirname, 'sandbox-validation-engine.js'),
      path.resolve(__dirname, 'theater-elimination-demo.js'),
      path.resolve(__dirname, 'evidence-generator.js'),
      path.resolve(__dirname, 'production-validation-runner.js')
    ];

    console.log(` Target Files: ${targetFiles.length}`);
    console.log(' Files to validate:');
    targetFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${path.basename(file)}`);
    });
    console.log('');

    // Execute production validation
    const validation = await runner.runProductionValidation(targetFiles);

    // Display final results
    console.log('\n THEATER ELIMINATION COMPLETE');
    console.log('===============================');
    console.log(`Validation ID: ${validation.id}`);
    console.log(`Success: ${validation.success ? 'YES' : 'NO'}`);
    console.log(`Theater Score: ${validation.phases?.demonstration?.evidence?.theaterElimination?.finalScore || 0}/100`);
    console.log(`Production Ready: ${validation.phases?.productionAssessment?.ready ? 'YES' : 'NO'}`);
    console.log(`Certification: ${validation.phases?.certification?.status || 'UNKNOWN'}`);

    if (validation.success) {
      console.log('\n PRODUCTION DEPLOYMENT AUTHORIZED');
      console.log('Theater elimination successful - system is production ready!');
    } else {
      console.log('\n PRODUCTION DEPLOYMENT BLOCKED');
      console.log('Theater elimination incomplete - address issues before deployment');

      if (validation.phases?.productionAssessment?.blockers?.length > 0) {
        console.log('\nBlocking Issues:');
        validation.phases.productionAssessment.blockers.forEach(blocker => {
          console.log(`   ${blocker}`);
        });
      }
    }

    // Cleanup
    console.log('\n Cleaning up resources...');
    await runner.cleanup();
    console.log('Cleanup complete.\n');

    // Exit with appropriate code
    process.exit(validation.success ? 0 : 1);

  } catch (error) {
    console.error('\n THEATER ELIMINATION FAILED');
    console.error('=============================');
    console.error(`Error: ${error.message}`);
    console.error('\nStack trace:');
    console.error(error.stack);

    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the theater elimination
if (require.main === module) {
  main();
}

module.exports = main;