/**
 * swarm/orchestration/WorkflowTypes.ts
 * DEPRECATED: Re-export from namespaced swarm types
 *
 * NAMESPACE SEPARATION (Week 5 Phase 2B):
 * This file now re-exports from the namespaced SwarmWorkflowTypes module.
 * The swarm workflow type system is architecturally distinct from the canonical
 * LangGraph workflow types and should not be consolidated.
 *
 * @deprecated Import from ~types/swarm/SwarmWorkflowTypes instead
 * @module swarm/orchestration/WorkflowTypes
 */

// Re-export all swarm workflow types from namespaced module
export * from '../../types/swarm/SwarmWorkflowTypes';

/**
 * MIGRATION GUIDE:
 *
 * Old import (still works via re-export):
 * import { WorkflowDefinition, WorkflowState } from './WorkflowTypes';
 *
 * Preferred import (use namespaced types):
 * import { SwarmWorkflowDefinition, SwarmWorkflowState } from '~types/swarm/SwarmWorkflowTypes';
 *
 * Or backward-compatible import:
 * import { WorkflowDefinition, WorkflowState } from '~types/swarm/SwarmWorkflowTypes';
 *
 * The namespaced types clarify that these are swarm-specific and distinct from
 * the canonical LangGraph workflow types in:
 * ~types/workflow/WorkflowTypes (which re-exports from canonical source)
 *
 * WHY NAMESPACE SEPARATION:
 * - Swarm: Stage-based multi-agent coordination with MECE validation
 * - Canonical: FSM-based template system with state transitions
 * - Prevents type conflicts and maintains architectural separation
 */
