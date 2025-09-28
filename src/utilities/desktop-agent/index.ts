/**
 * Desktop agent utilities for computer action processing
 * Decomposed from computerAction.utils.ts god object
 */

export {
  BaseConverterUtils,
  MouseActionConverters,
  KeyboardActionConverters,
  SystemActionConverters,
  FileActionConverters
} from './ActionConverters';

export {
  ActionTypeGuardFactory,
  MouseActionTypeGuards,
  KeyboardActionTypeGuards,
  SystemActionTypeGuards,
  FileActionTypeGuards,
  ActionTypeGuardUtils
} from './ActionTypeGuards';

export { UniversalActionConverter } from './UniversalConverter';

// Legacy exports for backward compatibility
export { UniversalActionConverter as convertComputerActionToToolUseBlock } from './UniversalConverter';
export { MouseActionTypeGuards as isMoveMouseAction } from './ActionTypeGuards';
export { MouseActionTypeGuards as isTraceMouseAction } from './ActionTypeGuards';
export { MouseActionTypeGuards as isClickMouseAction } from './ActionTypeGuards';
export { MouseActionTypeGuards as isPressMouseAction } from './ActionTypeGuards';
export { MouseActionTypeGuards as isDragMouseAction } from './ActionTypeGuards';
export { SystemActionTypeGuards as isScrollAction } from './ActionTypeGuards';
export { KeyboardActionTypeGuards as isTypeKeysAction } from './ActionTypeGuards';
export { KeyboardActionTypeGuards as isPressKeysAction } from './ActionTypeGuards';
export { KeyboardActionTypeGuards as isTypeTextAction } from './ActionTypeGuards';
export { SystemActionTypeGuards as isWaitAction } from './ActionTypeGuards';
export { SystemActionTypeGuards as isScreenshotAction } from './ActionTypeGuards';
export { SystemActionTypeGuards as isCursorPositionAction } from './ActionTypeGuards';
export { SystemActionTypeGuards as isApplicationAction } from './ActionTypeGuards';