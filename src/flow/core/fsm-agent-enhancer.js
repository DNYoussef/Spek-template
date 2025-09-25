/**
 * FSM Agent Enhancer
 * Automatically injects FSM thinking into agent prompts
 */

const { FSM_ARCHITECTURE_PROMPT } = require('../prompts/fsm-architecture-prompt');
const { FSM_CODER_PROMPT } = require('../prompts/fsm-coder-prompt');

class FSMAgentEnhancer {
  constructor() {
    // Map FSM prompt names to actual prompts
    this.fsmPrompts = {
      'FSM_ARCHITECTURE_PROMPT': FSM_ARCHITECTURE_PROMPT,
      'FSM_CODER_PROMPT': FSM_CODER_PROMPT
    };
  }

  /**
   * Enhance agent configuration with FSM capabilities
   */
  enhanceAgent(agentConfig, agentType) {
    // Check if FSM mode is enabled for this agent
    if (!agentConfig.fsmMode) {
      return agentConfig;
    }

    // Clone config to avoid mutations
    const enhanced = { ...agentConfig };

    // Add FSM capabilities
    if (!enhanced.capabilities) {
      enhanced.capabilities = [];
    }
    enhanced.capabilities.push('fsm_thinking', 'state_machine_design');

    // Add FSM-specific MCP servers if needed
    if (!enhanced.mcpServers) {
      enhanced.mcpServers = [];
    }
    if (!enhanced.mcpServers.includes('memory')) {
      enhanced.mcpServers.push('memory'); // For state persistence
    }

    // Prepare FSM metadata
    enhanced.fsmMetadata = {
      mode: agentConfig.fsmMode,
      promptType: agentConfig.fsmPrompt,
      agentType: agentType,
      validationRequired: agentConfig.fsmMode === 'required' || agentConfig.fsmMode === 'enforced'
    };

    return enhanced;
  }

  /**
   * Inject FSM prompt into agent's base prompt
   */
  injectFSMPrompt(basePrompt, agentConfig) {
    if (!agentConfig.fsmMode || !agentConfig.fsmPrompt) {
      return basePrompt;
    }

    const fsmPrompt = this.fsmPrompts[agentConfig.fsmPrompt];
    if (!fsmPrompt) {
      console.warn(`FSM prompt not found: ${agentConfig.fsmPrompt}`);
      return basePrompt;
    }

    // Determine injection strategy based on mode
    switch (agentConfig.fsmMode) {
      case 'required':
        // FSM prompt comes first, mandatory
        return `${fsmPrompt}\n\n---\n\nORIGINAL INSTRUCTIONS:\n${basePrompt}`;

      case 'enforced':
        // FSM prompt overrides, with strict validation
        return `${fsmPrompt}\n\n---\n\nADDITIONAL CONTEXT:\n${basePrompt}\n\n---\n\nREMEMBER: FSM patterns are MANDATORY. Non-compliant code will be REJECTED.`;

      case 'suggested':
        // FSM prompt as guidance
        return `${basePrompt}\n\n---\n\nRECOMMENDED APPROACH:\n${fsmPrompt}`;

      default:
        return basePrompt;
    }
  }

  /**
   * Validate agent output against FSM requirements
   */
  validateFSMCompliance(output, agentConfig) {
    if (!agentConfig.fsmMode || agentConfig.fsmMode === 'suggested') {
      return { valid: true, issues: [] };
    }

    const issues = [];

    // Check for FSM specification
    if (!output.includes('states:') && !output.includes('StateId')) {
      issues.push('Missing state definitions');
    }

    if (!output.includes('events:') && !output.includes('EventType')) {
      issues.push('Missing event definitions');
    }

    if (!output.includes('transitions:') && !output.includes('transition')) {
      issues.push('Missing transition definitions');
    }

    // For code output, check implementation patterns
    if (agentConfig.fsmPrompt === 'FSM_CODER_PROMPT') {
      if (!output.includes('implements StateContract') && !output.includes('class') && output.includes('State')) {
        issues.push('State not implementing StateContract');
      }

      if (output.includes('"START"') || output.includes("'START'")) {
        issues.push('Using string literals instead of enums for events');
      }

      if (!output.includes('init(') && output.includes('class')) {
        issues.push('Missing init() method in state');
      }

      if (!output.includes('update(') && output.includes('class')) {
        issues.push('Missing update() method in state');
      }

      if (!output.includes('shutdown(') && output.includes('class')) {
        issues.push('Missing shutdown() method in state');
      }
    }

    // For architecture output, check design completeness
    if (agentConfig.fsmPrompt === 'FSM_ARCHITECTURE_PROMPT') {
      if (!output.includes('fsm_spec')) {
        issues.push('Missing FSM specification file');
      }

      if (!output.includes('illegal_transitions')) {
        issues.push('Illegal transitions not declared');
      }

      if (!output.includes('guards') && !output.includes('guard')) {
        issues.push('No transition guards defined');
      }
    }

    return {
      valid: issues.length === 0,
      issues: issues,
      severity: agentConfig.fsmMode === 'required' ? 'error' : 'warning'
    };
  }

  /**
   * Generate FSM-aware task description
   */
  enhanceTaskDescription(task, agentConfig) {
    if (!agentConfig.fsmMode) {
      return task;
    }

    const fsmPrefix = agentConfig.fsmMode === 'required'
      ? '[FSM REQUIRED] '
      : agentConfig.fsmMode === 'enforced'
      ? '[FSM ENFORCED] '
      : '[FSM] ';

    const fsmSuffix = '\n\nEnsure all implementations follow state machine patterns with proper state isolation, centralized transitions, and complete state contracts.';

    return `${fsmPrefix}${task}${fsmSuffix}`;
  }

  /**
   * Get FSM quality metrics from output
   */
  extractFSMMetrics(output) {
    const metrics = {
      stateCount: 0,
      eventCount: 0,
      transitionCount: 0,
      guardCount: 0,
      invariantCount: 0,
      illegalTransitionCount: 0,
      stateIsolation: false,
      centralizedTransitions: false
    };

    // Count states
    const stateMatches = output.match(/state[s]?:\s*\n([\s\S]*?)(?:\n\w|\n$)/gi);
    if (stateMatches) {
      const stateLines = stateMatches[0].split('\n').filter(line => line.trim().startsWith('-'));
      metrics.stateCount = stateLines.length;
    }

    // Count events
    const eventMatches = output.match(/event[s]?:\s*\n([\s\S]*?)(?:\n\w|\n$)/gi);
    if (eventMatches) {
      const eventLines = eventMatches[0].split('\n').filter(line => line.trim().startsWith('-'));
      metrics.eventCount = eventLines.length;
    }

    // Count transitions
    metrics.transitionCount = (output.match(/->|->|transitions?:/gi) || []).length;

    // Count guards
    metrics.guardCount = (output.match(/guard[s]?:|canTransition|if\s*\(/gi) || []).length;

    // Count invariants
    metrics.invariantCount = (output.match(/invariant[s]?:|checkInvariants/gi) || []).length;

    // Count illegal transitions
    metrics.illegalTransitionCount = (output.match(/illegal_transition[s]?|ILLEGAL/gi) || []).length;

    // Check for state isolation (one file per state)
    metrics.stateIsolation = output.includes('State.ts') || output.includes('State.js') || output.includes('/states/');

    // Check for centralized transitions
    metrics.centralizedTransitions = output.includes('TransitionHub') || output.includes('transition(') || output.includes('switch_state');

    return metrics;
  }
}

// Singleton instance
const fsmEnhancer = new FSMAgentEnhancer();

module.exports = {
  FSMAgentEnhancer,
  fsmEnhancer,

  // Helper functions for easy integration
  enhanceAgent: (config, type) => fsmEnhancer.enhanceAgent(config, type),
  injectFSMPrompt: (prompt, config) => fsmEnhancer.injectFSMPrompt(prompt, config),
  validateFSMCompliance: (output, config) => fsmEnhancer.validateFSMCompliance(output, config),
  enhanceTaskDescription: (task, config) => fsmEnhancer.enhanceTaskDescription(task, config),
  extractFSMMetrics: (output) => fsmEnhancer.extractFSMMetrics(output)
};

/* AGENT FOOTER BEGIN */
// Version & Run Log
// | Version | Timestamp | Agent/Model | Change Summary | Status | Hash |
// |---------|-----------|-------------|----------------|--------|------|
// | 1.0.0 | 2025-01-24T11:00:00Z | FSM Enhancer | Agent FSM enhancement | OK | f3a5b7 |
/* AGENT FOOTER END */