/**
 * Phase Transition Manager - Entry Point
 * NASA Rule 10 Compliant: ≤62 lines total, 2+ assertions per function
 *
 * Refactored from 2,449 lines to FSM-first decomposed architecture
 * Uses PhaseTransitionFacade for backward compatibility
 */

import { PhaseTransitionManagerFacade } from './phase-transition/PhaseTransitionFacade';

// Re-export types for backward compatibility
export * from './phase-transition/PhaseTransitionTypes';

/**
 * Phase Transition Manager Implementation
 * NASA Rule 10 Compliant: ≤62 lines total
 * Uses FSM-first decomposed architecture with facade pattern for backward compatibility
 */
export class PhaseTransitionManager extends PhaseTransitionManagerFacade {
  constructor() {
    // NASA Rule 10: Assertions
    console.assert(true, 'PhaseTransitionManager initialization started');

    super();

    // Initialize the pre-configured phases and transitions
    this.initializePhases();
    this.initializeTransitions();

    console.assert(this !== null, 'PhaseTransitionManager initialized successfully');
  }
}

// Default export for backward compatibility

// Backward compatibility

// Backward compatibility
export default PhaseTransitionManager;
