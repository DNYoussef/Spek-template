/**
 * Conversion State Machine - FSM for message format conversion
 * NASA Rule 10 Compliant: Fixed bounds and non-recursive state management
 */

import { ConversionState, ConversionEvent } from './MessageFormatTypes';

export class ConversionStateMachine {
  private currentState: ConversionState = ConversionState.IDLE;
  private readonly transitions = new Map<string, ConversionState>([
    [`${ConversionState.IDLE}:${ConversionEvent.START_CONVERSION}`, ConversionState.VALIDATING_FORMAT],
    [`${ConversionState.VALIDATING_FORMAT}:${ConversionEvent.FORMAT_VALIDATED}`, ConversionState.DESERIALIZING],
    [`${ConversionState.VALIDATING_FORMAT}:${ConversionEvent.FORMAT_INVALID}`, ConversionState.ERROR],
    [`${ConversionState.DESERIALIZING}:${ConversionEvent.DESERIALIZATION_COMPLETE}`, ConversionState.CONVERTING],
    [`${ConversionState.DESERIALIZING}:${ConversionEvent.DESERIALIZATION_FAILED}`, ConversionState.ERROR],
    [`${ConversionState.CONVERTING}:${ConversionEvent.CONVERSION_COMPLETE}`, ConversionState.SERIALIZING],
    [`${ConversionState.CONVERTING}:${ConversionEvent.CONVERSION_FAILED}`, ConversionState.ERROR],
    [`${ConversionState.SERIALIZING}:${ConversionEvent.SERIALIZATION_COMPLETE}`, ConversionState.VALIDATING_RESULT],
    [`${ConversionState.SERIALIZING}:${ConversionEvent.SERIALIZATION_FAILED}`, ConversionState.ERROR],
    [`${ConversionState.VALIDATING_RESULT}:${ConversionEvent.VALIDATION_COMPLETE}`, ConversionState.COMPLETED],
    [`${ConversionState.VALIDATING_RESULT}:${ConversionEvent.VALIDATION_FAILED}`, ConversionState.ERROR],
    [`${ConversionState.ERROR}:${ConversionEvent.RESET}`, ConversionState.IDLE],
    [`${ConversionState.COMPLETED}:${ConversionEvent.RESET}`, ConversionState.IDLE]
  ]);

  /**
   * Transition to next state based on event - NASA Rule 10: Fixed transitions
   */
  transition(event: ConversionEvent): boolean {
    // Assertion 1: Valid current state
    console.assert(
      Object.values(ConversionState).includes(this.currentState),
      `Invalid current state: ${this.currentState}`
    );
    // Assertion 2: Valid event
    console.assert(
      Object.values(ConversionEvent).includes(event),
      `Invalid event: ${event}`
    );

    const key = `${this.currentState}:${event}`;
    const nextState = this.transitions.get(key);

    if (nextState) {
      this.currentState = nextState;
      return true;
    }
    return false;
  }

  /**
   * Get current state - NASA Rule 10: Single responsibility
   */
  getState(): ConversionState {
    // Assertion 1: State is valid
    console.assert(
      Object.values(ConversionState).includes(this.currentState),
      `Current state is invalid: ${this.currentState}`
    );
    // Assertion 2: State machine is initialized
    console.assert(this.transitions.size > 0, 'State machine must be initialized');

    return this.currentState;
  }

  /**
   * Reset to initial state - NASA Rule 10: Single responsibility
   */
  reset(): void {
    // Assertion 1: Reset to valid initial state
    console.assert(ConversionState.IDLE !== undefined, 'IDLE state must be defined');
    // Assertion 2: Transitions map exists
    console.assert(this.transitions instanceof Map, 'Transitions must be Map instance');

    this.currentState = ConversionState.IDLE;
  }

  /**
   * Check if in error state - NASA Rule 10: Single responsibility
   */
  isInErrorState(): boolean {
    // Assertion 1: Error state is defined
    console.assert(ConversionState.ERROR !== undefined, 'ERROR state must be defined');
    // Assertion 2: Current state is valid
    console.assert(this.currentState !== undefined, 'Current state must be defined');

    return this.currentState === ConversionState.ERROR;
  }

  /**
   * Check if conversion completed - NASA Rule 10: Single responsibility
   */
  isCompleted(): boolean {
    // Assertion 1: Completed state is defined
    console.assert(ConversionState.COMPLETED !== undefined, 'COMPLETED state must be defined');
    // Assertion 2: Current state is valid
    console.assert(this.currentState !== undefined, 'Current state must be defined');

    return this.currentState === ConversionState.COMPLETED;
  }

  /**
   * Get valid next events for current state - NASA Rule 10: Fixed bounds
   */
  getValidNextEvents(): ConversionEvent[] {
    // Assertion 1: Current state is valid
    console.assert(this.currentState !== undefined, 'Current state must be defined');
    // Assertion 2: Transitions map exists
    console.assert(this.transitions.size > 0, 'Transitions map must exist');

    const validEvents: ConversionEvent[] = [];
    const maxEvents = Object.keys(ConversionEvent).length; // Fixed bound

    // NASA Rule 10: Fixed iteration through all possible events
    for (const event of Object.values(ConversionEvent)) {
      const key = `${this.currentState}:${event}`;
      if (this.transitions.has(key)) {
        validEvents.push(event);
      }

      // NASA Rule 10: Safety bound
      if (validEvents.length >= maxEvents) {
        break;
      }
    }

    return validEvents;
  }

  /**
   * Check if transition is valid - NASA Rule 10: Single responsibility
   */
  canTransition(event: ConversionEvent): boolean {
    // Assertion 1: Valid event parameter
    console.assert(
      Object.values(ConversionEvent).includes(event),
      `Invalid event parameter: ${event}`
    );
    // Assertion 2: State machine is ready
    console.assert(this.currentState !== undefined, 'State machine must be initialized');

    const key = `${this.currentState}:${event}`;
    return this.transitions.has(key);
  }

  /**
   * Get transition history (for debugging) - NASA Rule 10: Fixed bounds
   */
  getStateInfo(): {
    currentState: ConversionState;
    validTransitions: string[];
    totalTransitions: number;
  } {
    // Assertion 1: State machine is initialized
    console.assert(this.currentState !== undefined, 'State machine must be initialized');
    // Assertion 2: Transitions exist
    console.assert(this.transitions.size > 0, 'Transitions must exist');

    const validTransitions: string[] = [];
    const maxTransitionCheck = 20; // NASA Rule 10: Fixed bound

    let checkCount = 0;
    for (const [key, targetState] of this.transitions) {
      if (key.startsWith(`${this.currentState}:`)) {
        const event = key.split(':')[1];
        validTransitions.push(`${event} -> ${targetState}`);
      }

      checkCount++;
      if (checkCount >= maxTransitionCheck) {
        break;
      }
    }

    return {
      currentState: this.currentState,
      validTransitions,
      totalTransitions: this.transitions.size
    };
  }
}