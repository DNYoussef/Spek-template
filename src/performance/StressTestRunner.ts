/**
 * REFACTORED: StressTestRunner now uses FSM-based architecture
 * This file serves as a compatibility layer for existing imports
 * NASA Rule 10 compliant: Delegates to decomposed FSM system
 */

// Re-export from new FSM-based implementation
export * from './stress-test/types/StressTestTypes';
export { StressTestRunnerFacade as StressTestRunner } from './stress-test/StressTestRunnerFacade';

// Legacy import compatibility
import { StressTestRunnerFacade } from './stress-test/StressTestRunnerFacade';

// Default export compatibility for legacy usage
export default StressTestRunnerFacade;