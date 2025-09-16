/**
 * Custom Jest Test Sequencer
 * Runs faster tests first to get quick feedback
 */

const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    // Define test priority (lower number = higher priority)
    const getPriority = (testPath) => {
      if (testPath.includes('unit')) return 1;
      if (testPath.includes('six-sigma')) return 2;
      if (testPath.includes('sbom')) return 2;
      if (testPath.includes('compliance')) return 2;
      if (testPath.includes('domains')) return 3;
      if (testPath.includes('enterprise')) return 4;
      if (testPath.includes('integration')) return 5;
      if (testPath.includes('e2e')) return 6;
      return 3; // Default priority
    };

    return tests.sort((testA, testB) => {
      const priorityA = getPriority(testA.path);
      const priorityB = getPriority(testB.path);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // If same priority, sort by file size (smaller files first)
      return testA.duration - testB.duration;
    });
  }
}

module.exports = CustomSequencer;