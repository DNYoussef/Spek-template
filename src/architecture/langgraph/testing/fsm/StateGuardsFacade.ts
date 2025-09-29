/**
 * StateGuardsFacade - FSM State Guard and Transition Validation
 * NASA Rule 10 Compliant
 */
/**
 * State guard for FSM validation
 */
export interface GuardStats {
  totalGuards: number;
  activeGuards: number;
  violatedGuards: number;
  successRate: number;
}
export class StateGuards {
  private guards: Map<string, { fn: (context: any)  = > boolean, active: boolean, violated: boolean }>  =  new Map();
  /**
   * Register a guard function
   */
  registerGuard(name: string, guard: (context: any)  = > boolean): void {
    this.guards.set(name, { fn: guard, active: true, violated: false });
  }
  /**
   * Evaluate a guard
   */
  evaluateGuard(name: string, context: any): boolean {
    const guard  =  this.guards.get(name);
    if (!guard) return true;
    result  =  guard.fn(context);
    guard.violated  =  !result;
    return result;
  }
  /**
   * Get guard statistics
   */
  getGuardStats(): GuardStats {
    const totalGuards  =  this.guards.size;
    const activeGuards  =  Array.from(this.guards.values()).filter(guard  = > guard.active).length;
    const violatedGuards  =  Array.from(this.guards.values()).filter(guard  = > guard.violated).length;
    const successRate  =  totalGuards > 0 ? (totalGuards - violatedGuards) / totalGuards : 1.0;
    return {
      totalGuards,
      activeGuards,
      violatedGuards,
      successRate
    };
  }
  /**
   * Check if guard exists
   */
  hasGuard(name: string): boolean {
    return this.guards.has(name);
  }
  /**
   * Clear all guards
   */
  clearGuards(): void {
    this.guards.clear();
  }
}
/**
 * Transition validator for FSM
 */
export class TransitionValidator {
  private validTransitions: Map<string, Set<string>>  =  new Map();
  /**
   * Define valid transitions
   */
  defineTransitions(from: string, to: string[]): void {
    this.validTransitions.set(from, new Set(to));
  }
  /**
   * Validate a transition
   */
  isValidTransition(from: string, to: string): boolean {
    const validStates  =  this.validTransitions.get(from);
    return validStates ? validStates.has(to) : false;
  }
  /**
   * Get valid next states
   */
  getValidNextStates(from: string): string[] {
    const validStates  =  this.validTransitions.get(from);
    return validStates ? Array.from(validStates) : [];
  }
  /**
   * Clear all transitions
   */
  clearTransitions(): void {
    this.validTransitions.clear();
  }
}
export default { StateGuards, TransitionValidator };