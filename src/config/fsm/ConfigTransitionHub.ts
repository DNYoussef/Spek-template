/**
 * ConfigTransitionHub - Centralized Configuration State Management
 * Single point of control for all configuration state transitions
 *
 * NASA Rule 10: ≤60 line functions, bounded transition management
 * FSM-First: Centralized transition control with guards
 */

import { ConfigState, ConfigEvent, ConfigContext, StateTransition, TransitionGuard } from '../types/ConfigTypes';

export class ConfigTransitionHub {
    private transitions: Map<string, StateTransition>;
    private guards: Map<string, TransitionGuard>;

    constructor() {
        this.transitions = new Map();
        this.guards = new Map();
    }

    /**
     * Add state transition - NASA Rule 10: ≤60 lines
     */
    addTransition(
        fromState: ConfigState,
        event: ConfigEvent,
        toState: ConfigState,
        handler: (context: ConfigContext) => Promise<boolean>,
        guard?: TransitionGuard
    ): void {
        const key = this.getTransitionKey(fromState, event);

        const transition: StateTransition = {
            fromState,
            event,
            toState,
            handler,
            guard
        };

        this.transitions.set(key, transition);

        if (guard) {
            this.guards.set(key, guard);
        }
    }

    /**
     * Execute state transition - NASA Rule 10: ≤60 lines
     */
    async transition(context: ConfigContext, event: ConfigEvent): Promise<boolean> {
        const key = this.getTransitionKey(context.currentState, event);
        const transition = this.transitions.get(key);

        if (!transition) {
            console.warn(`No transition found: ${context.currentState} + ${event}`);
            return false;
        }

        // Check guard condition
        if (transition.guard && !transition.guard(context)) {
            console.warn(`Transition guard failed: ${key}`);
            return false;
        }

        // Update state
        const previousState = context.currentState;
        context.currentState = transition.toState;

        try {
            const result = await transition.handler(context);

            if (!result) {
                // Rollback on failure
                context.currentState = previousState;
            }

            return result;
        } catch (error) {
            // Rollback on exception
            context.currentState = previousState;
            throw error;
        }
    }

    /**
     * Get all valid transitions from current state
     */
    getValidTransitions(currentState: ConfigState): ConfigEvent[] {
        const validEvents: ConfigEvent[] = [];

        for (const [key, transition] of this.transitions) {
            if (transition.fromState === currentState) {
                validEvents.push(transition.event);
            }
        }

        return validEvents;
    }

    /**
     * Check if transition is valid
     */
    isValidTransition(fromState: ConfigState, event: ConfigEvent): boolean {
        const key = this.getTransitionKey(fromState, event);
        return this.transitions.has(key);
    }

    /**
     * Generate transition key
     */
    private getTransitionKey(state: ConfigState, event: ConfigEvent): string {
        return `${state}->${event}`;
    }
}